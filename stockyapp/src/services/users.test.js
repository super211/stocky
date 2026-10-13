import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./firebase', () => ({ db: { name: 'db' } }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, ...path) => ({ path: path.join('/') })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIME'),
}))

import { getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { getProfile, saveDailyGoal, saveProfile } from './users'

const snapshot = (data) => ({ exists: () => data !== null, data: () => data })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getProfile', () => {
  it('returns the profile data when the document exists', async () => {
    getDoc.mockResolvedValue(snapshot({ dailyGoal: 2000 }))
    await expect(getProfile('u1')).resolves.toEqual({ dailyGoal: 2000 })
    expect(getDoc).toHaveBeenCalledWith({ path: 'users/u1' })
  })

  it('returns null when there is no profile yet', async () => {
    getDoc.mockResolvedValue(snapshot(null))
    await expect(getProfile('u1')).resolves.toBeNull()
  })
})

describe('saveProfile', () => {
  it('creates the document with createdAt on first save', async () => {
    getDoc.mockResolvedValue(snapshot(null))
    await saveProfile('u1', { onboarded: true })
    expect(setDoc).toHaveBeenCalledWith(
      { path: 'users/u1' },
      { onboarded: true, createdAt: 'SERVER_TIME' },
    )
    expect(updateDoc).not.toHaveBeenCalled()
  })

  it('updates the document with updatedAt when it already exists', async () => {
    getDoc.mockResolvedValue(snapshot({ onboarded: true }))
    await saveProfile('u1', { dailyGoal: 1800 })
    expect(updateDoc).toHaveBeenCalledWith(
      { path: 'users/u1' },
      { dailyGoal: 1800, updatedAt: 'SERVER_TIME' },
    )
    expect(setDoc).not.toHaveBeenCalled()
  })
})

describe('saveDailyGoal', () => {
  it('saves the goal as a profile field', async () => {
    getDoc.mockResolvedValue(snapshot({}))
    await saveDailyGoal('u1', 2200)
    expect(updateDoc).toHaveBeenCalledWith(
      { path: 'users/u1' },
      { dailyGoal: 2200, updatedAt: 'SERVER_TIME' },
    )
  })
})
