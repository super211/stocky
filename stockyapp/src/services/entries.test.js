import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestore = vi.hoisted(() => ({
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  addDoc: firestore.addDoc,
  updateDoc: firestore.updateDoc,
  deleteDoc: firestore.deleteDoc,
  collection: vi.fn((...path) => ({ path })),
  doc: vi.fn((col, id) => ({ col, id })),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIME'),
}))
vi.mock('./firebase', () => ({ db: {} }))
vi.mock('./foods', () => ({ touchFood: vi.fn(() => Promise.resolve()) }))

import { addEntry, deleteEntry, updateEntry } from './entries'
import { touchFood } from './foods'

const food = { id: 'f1', name: 'Rice', servingLabel: '1 cup', calories: 200 }

beforeEach(() => {
  vi.clearAllMocks()
  firestore.addDoc.mockResolvedValue({ id: 'e1' })
})

describe('addEntry', () => {
  it('stores a snapshot of the food and the calculated total', async () => {
    const entry = await addEntry('u1', { food, date: '2026-10-09', meal: 'lunch', servings: 1.5 })

    expect(entry).toMatchObject({
      id: 'e1',
      date: '2026-10-09',
      meal: 'lunch',
      foodId: 'f1',
      name: 'Rice',
      servingLabel: '1 cup',
      caloriesPerServing: 200,
      servings: 1.5,
      totalCalories: 300,
    })
    expect(firestore.addDoc).toHaveBeenCalledOnce()
    expect(firestore.addDoc.mock.calls[0][1].createdAt).toBe('SERVER_TIME')
  })

  it('clamps unreasonable serving counts', async () => {
    const entry = await addEntry('u1', { food, date: '2026-10-09', meal: 'lunch', servings: 0 })
    expect(entry.servings).toBe(0.25)
    expect(entry.totalCalories).toBe(50)
  })

  it('marks the food as recently used', async () => {
    await addEntry('u1', { food, date: '2026-10-09', meal: 'lunch', servings: 1 })
    expect(touchFood).toHaveBeenCalledWith('u1', 'f1')
  })

  it('still succeeds when updating lastUsedAt fails', async () => {
    touchFood.mockRejectedValueOnce(new Error('offline'))
    await expect(
      addEntry('u1', { food, date: '2026-10-09', meal: 'lunch', servings: 1 }),
    ).resolves.toMatchObject({ id: 'e1' })
  })
})

describe('updateEntry', () => {
  const entry = {
    id: 'e1',
    meal: 'lunch',
    caloriesPerServing: 200,
    servings: 1,
    totalCalories: 200,
  }

  it('recalculates the total from the stored per-serving calories', async () => {
    const updated = await updateEntry('u1', entry, { servings: 2, meal: 'dinner' })
    expect(updated).toMatchObject({ servings: 2, meal: 'dinner', totalCalories: 400 })
    expect(firestore.updateDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }), {
      servings: 2,
      meal: 'dinner',
      totalCalories: 400,
    })
  })
})

describe('deleteEntry', () => {
  it('deletes the entry document', async () => {
    await deleteEntry('u1', 'e1')
    expect(firestore.deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }))
  })
})
