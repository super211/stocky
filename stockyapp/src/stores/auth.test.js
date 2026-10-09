import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/firebase', () => ({ auth: { currentUser: null } }))
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class {},
  createUserWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('@/services/users', () => ({
  getProfile: vi.fn(),
  saveDailyGoal: vi.fn(),
  saveProfile: vi.fn(),
}))

import { signOut } from 'firebase/auth'
import { getProfile, saveDailyGoal, saveProfile } from '@/services/users'
import { authMessage, useAuthStore } from './auth'

let store

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  store = useAuthStore()
})

describe('authMessage', () => {
  it('translates known Firebase error codes', () => {
    expect(authMessage({ code: 'auth/invalid-credential' })).toBe('Incorrect email or password.')
    expect(authMessage({ code: 'auth/email-already-in-use' })).toMatch(/already exists/)
    expect(authMessage({ code: 'auth/weak-password' })).toMatch(/6 characters/)
  })

  it('stays silent when the user closes the Google popup', () => {
    expect(authMessage({ code: 'auth/popup-closed-by-user' })).toBe('')
    expect(authMessage({ code: 'auth/cancelled-popup-request' })).toBe('')
  })

  it('falls back to the error message, then a generic one', () => {
    expect(authMessage({ message: 'custom' })).toBe('custom')
    expect(authMessage({})).toMatch(/Something went wrong/)
    expect(authMessage(undefined)).toMatch(/Something went wrong/)
  })
})

describe('getters', () => {
  it('is signed out by default and does not need setup', () => {
    expect(store.isSignedIn).toBe(false)
    expect(store.needsSetup).toBe(false)
    expect(store.uid).toBeNull()
    expect(store.dailyGoal).toBeNull()
  })

  it('needs setup when signed in without an onboarded profile', () => {
    store.user = { uid: 'u1' }
    expect(store.needsSetup).toBe(true)
    store.profile = { dailyGoal: 2000 }
    expect(store.needsSetup).toBe(true)
  })

  it('does not need setup once onboarded', () => {
    store.user = { uid: 'u1' }
    store.profile = { dailyGoal: 1800, onboarded: true }
    expect(store.needsSetup).toBe(false)
    expect(store.dailyGoal).toBe(1800)
    expect(store.uid).toBe('u1')
  })
})

describe('actions', () => {
  beforeEach(() => {
    store.user = { uid: 'u1' }
  })

  it('setDailyGoal saves the goal and keeps the rest of the profile', async () => {
    store.profile = { onboarded: true, age: 30, dailyGoal: 2000 }
    await store.setDailyGoal(1700)
    expect(saveDailyGoal).toHaveBeenCalledWith('u1', 1700)
    expect(store.profile).toEqual({ onboarded: true, age: 30, dailyGoal: 1700 })
  })

  it('saveOnboarding stores the answers and marks onboarding done', async () => {
    const answers = { gender: 'female', age: 30, weeklyChangeLb: -1, dailyGoal: 1489 }
    await store.saveOnboarding(answers)
    expect(saveProfile).toHaveBeenCalledWith('u1', { ...answers, onboarded: true })
    expect(store.profile).toMatchObject({ ...answers, onboarded: true })
    expect(store.needsSetup).toBe(false)
  })

  it('saveOnboarding leaves local state alone when saving fails', async () => {
    saveProfile.mockRejectedValueOnce(new Error('offline'))
    await expect(store.saveOnboarding({ dailyGoal: 1500 })).rejects.toThrow('offline')
    expect(store.profile).toBeNull()
    expect(store.needsSetup).toBe(true)
  })

  it('logout signs out and resets the store', async () => {
    store.profile = { onboarded: true, dailyGoal: 2000 }
    await store.logout()
    expect(signOut).toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.profile).toBeNull()
  })
})

describe('afterSignIn', () => {
  it('loads the profile of the current user', async () => {
    const { auth } = await import('@/services/firebase')
    auth.currentUser = { uid: 'u9' }
    getProfile.mockResolvedValue({ onboarded: true, dailyGoal: 2100 })
    await store.afterSignIn()
    expect(getProfile).toHaveBeenCalledWith('u9')
    expect(store.dailyGoal).toBe(2100)
    auth.currentUser = null
  })
})
