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

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    // The users/{uid} document (body details, weekly goal, dailyGoal), or null if none yet.
    profile: null,
  }),
  getters: {
    isSignedIn: (s) => Boolean(s.user),
    dailyGoal: (s) => s.profile?.dailyGoal ?? null,
    needsSetup: (s) => Boolean(s.user) && !s.profile?.onboarded,
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
            if (user) {
              try {
                this.profile = await getProfile(user.uid)
              } catch {
                this.profile = null
              }
            }
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
    // onAuthStateChanged loads the profile asynchronously; load it here too so the route guard
    // sees the right goal immediately after login.
    async afterSignIn() {
      const user = auth.currentUser
      this.user = user
      this.profile = user ? await getProfile(user.uid) : null
    },
    resetPassword(email) {
      return sendPasswordResetEmail(auth, email)
    },
    async setDailyGoal(goal) {
      await saveDailyGoal(this.user.uid, goal)
      this.profile = { ...this.profile, dailyGoal: goal }
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
