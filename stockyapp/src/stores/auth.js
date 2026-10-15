import { defineStore } from 'pinia'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from '@/services/firebase'
import { getProfile, saveDailyGoal, saveProfile } from '@/services/users'

const ERRORS = {
  'auth/invalid-email': 'That email address is not valid.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/popup-blocked': 'The sign-in popup was blocked by your browser.',
}

export function authMessage(e) {
  if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
    return ''
  }
  return ERRORS[e?.code] || e?.message || 'Something went wrong. Please try again.'
}

let initPromise = null
// Bumped on every profile load so a slow, older read can't overwrite a newer one.
let loadSeq = 0

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    // The users/{uid} document (body details, weekly goal, dailyGoal), or null if none yet.
    profile: null,
    // Set when reading the profile failed (offline, blocked network, ...). Distinct from "no
    // profile yet": a failed read must never be mistaken for a user who hasn't onboarded.
    profileError: '',
  }),
  getters: {
    isSignedIn: (s) => Boolean(s.user),
    dailyGoal: (s) => s.profile?.dailyGoal ?? null,
    needsSetup: (s) => Boolean(s.user) && !s.profileError && !s.profile?.onboarded,
    uid: (s) => s.user?.uid ?? null,
  },
  actions: {
    // Resolves once Firebase has reported the initial auth state (and profile, if signed in).
    init() {
      if (!initPromise) {
        initPromise = new Promise((resolve) => {
          let first = true
          onAuthStateChanged(auth, async (user) => {
            this.user = user
            this.profile = null
            this.profileError = ''
            await this.loadProfile()
            if (first) {
              first = false
              resolve()
            }
          })
        })
      }
      return initPromise
    },
    async signIn(email, password) {
      await signInWithEmailAndPassword(auth, email, password)
      await this.afterSignIn()
    },
    async signUp(email, password) {
      await createUserWithEmailAndPassword(auth, email, password)
      await this.afterSignIn()
    },
    async signInWithGoogle() {
      await signInWithPopup(auth, new GoogleAuthProvider())
      await this.afterSignIn()
    },
    // Reads users/{uid} for the signed-in user. Failures are recorded in `profileError` rather
    // than thrown or swallowed, so callers can tell "failed to load" from "has no profile".
    async loadProfile() {
      const seq = ++loadSeq
      const uid = this.user?.uid
      if (!uid) {
        this.profile = null
        this.profileError = ''
        return
      }
      try {
        const profile = await getProfile(uid)
        if (seq !== loadSeq) return
        this.profile = profile
        this.profileError = ''
      } catch (e) {
        if (seq !== loadSeq) return
        this.profile = null
        this.profileError = e?.message || 'Could not load your profile.'
      }
    },
    // onAuthStateChanged loads the profile asynchronously; load it here too so the route guard
    // sees the right goal immediately after login.
    async afterSignIn() {
      this.user = auth.currentUser
      await this.loadProfile()
    },
    resetPassword(email) {
      return sendPasswordResetEmail(auth, email)
    },
    async setDailyGoal(goal) {
      await saveDailyGoal(this.user.uid, goal)
      this.profile = { ...this.profile, dailyGoal: goal }
    },
    // Updates the in-memory profile first so a slower, older save can't flip the theme back; a
    // failed save rejects but leaves the chosen theme in place.
    async setTheme(theme) {
      if (this.profile) this.profile = { ...this.profile, theme }
      await saveProfile(this.user.uid, { theme })
    },
    // Saves the onboarding answers and the calorie goal calculated from them.
    async saveOnboarding(data) {
      const profile = { ...data, onboarded: true }
      await saveProfile(this.user.uid, profile)
      this.profile = { ...this.profile, ...profile }
    },
    async logout() {
      await signOut(auth)
      this.$reset()
    },
  },
})
