import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestore = vi.hoisted(() => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, ...path) => ({ path: path.join('/') })),
  getDoc: firestore.getDoc,
  setDoc: firestore.setDoc,
  updateDoc: firestore.updateDoc,
  serverTimestamp: vi.fn(() => 'SERVER_TIME'),
}))
vi.mock('./firebase', () => ({ db: {} }))

import { getProfile, saveDailyGoal, saveProfile } from './users'

beforeEach(() => vi.clearAllMocks())

describe('getProfile', () => {
  it('returns the document data, or null when there is none', async () => {
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ dailyGoal: 1800 }),
    })
    expect(await getProfile('u1')).toEqual({ dailyGoal: 1800 })
    firestore.getDoc.mockResolvedValueOnce({ exists: () => false })
    expect(await getProfile('u1')).toBeNull()
  })

  it('lets read errors through so callers can tell "failed" from "no profile"', async () => {
    firestore.getDoc.mockRejectedValue(new Error('offline'))
    await expect(getProfile('u1')).rejects.toThrow('offline')
  })
})

describe('saveProfile', () => {
  it('updates an existing document and stamps updatedAt', async () => {
    firestore.getDoc.mockResolvedValue({ exists: () => true })
    await saveProfile('u1', { onboarded: true })
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      { path: 'users/u1' },
      { onboarded: true, updatedAt: 'SERVER_TIME' },
    )
    expect(firestore.setDoc).not.toHaveBeenCalled()
  })

  it('creates the document with createdAt when it does not exist', async () => {
    firestore.getDoc.mockResolvedValue({ exists: () => false })
    await saveProfile('u1', { onboarded: true, dailyGoal: 1500 })
    expect(firestore.setDoc).toHaveBeenCalledOnce()
    const [ref, data] = firestore.setDoc.mock.calls[0]
    expect(ref).toEqual({ path: 'users/u1' })
    expect(data).toMatchObject({ onboarded: true, dailyGoal: 1500, createdAt: 'SERVER_TIME' })
  })

  it('merges when creating, so a stale "missing" read cannot wipe existing fields', async () => {
    firestore.getDoc.mockResolvedValue({ exists: () => false })
    await saveProfile('u1', { dailyGoal: 1500 })
    expect(firestore.setDoc.mock.calls[0][2]).toEqual({ merge: true })
  })

  it('saveDailyGoal only writes the goal', async () => {
    firestore.getDoc.mockResolvedValue({ exists: () => true })
    await saveDailyGoal('u1', 1700)
    expect(firestore.updateDoc.mock.calls[0][1]).toMatchObject({ dailyGoal: 1700 })
    expect(Object.keys(firestore.updateDoc.mock.calls[0][1]).sort()).toEqual([
      'dailyGoal',
      'updatedAt',
    ])
  })
})
