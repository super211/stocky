import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ uid: 'u1' }) }))
vi.mock('@/services/entries', () => ({
  listEntriesByDate: vi.fn(),
  addEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
}))

import { addEntry, deleteEntry, listEntriesByDate, updateEntry } from '@/services/entries'
import { useDiaryStore } from './diary'

const entry = (id, meal, totalCalories, date = '2026-10-09') => ({ id, meal, totalCalories, date })

let diary

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  diary = useDiaryStore()
})

describe('getters', () => {
  beforeEach(() => {
    diary.entries = [
      entry('1', 'breakfast', 300),
      entry('2', 'lunch', 500),
      entry('3', 'lunch', 150),
    ]
  })

  it('total sums every entry', () => {
    expect(diary.total).toBe(950)
  })

  it('byMeal groups entries and includes empty meals', () => {
    expect(diary.byMeal.lunch).toHaveLength(2)
    expect(diary.byMeal.dinner).toEqual([])
    expect(Object.keys(diary.byMeal)).toEqual(['breakfast', 'lunch', 'dinner', 'snacks'])
  })

  it('mealTotal returns the subtotal for one meal', () => {
    expect(diary.mealTotal('lunch')).toBe(650)
    expect(diary.mealTotal('snacks')).toBe(0)
  })
})

describe('load', () => {
  it('loads entries for the date using the signed-in user', async () => {
    listEntriesByDate.mockResolvedValue([entry('1', 'lunch', 400)])
    await diary.load('2026-10-08')
    expect(listEntriesByDate).toHaveBeenCalledWith('u1', '2026-10-08')
    expect(diary.date).toBe('2026-10-08')
    expect(diary.entries).toHaveLength(1)
    expect(diary.loading).toBe(false)
    expect(diary.error).toBe('')
  })

  it('records an error and clears entries on failure', async () => {
    diary.entries = [entry('1', 'lunch', 400)]
    listEntriesByDate.mockRejectedValue(new Error('boom'))
    await diary.load('2026-10-08')
    expect(diary.error).toBe('boom')
    expect(diary.entries).toEqual([])
    expect(diary.loading).toBe(false)
  })

  it('ignores a slow response for a day the user already left', async () => {
    let resolveFirst
    listEntriesByDate
      .mockReturnValueOnce(new Promise((r) => (resolveFirst = r)))
      .mockResolvedValueOnce([entry('2', 'dinner', 700, '2026-10-10')])

    const first = diary.load('2026-10-09')
    await diary.load('2026-10-10')
    resolveFirst([entry('1', 'lunch', 100)])
    await first

    expect(diary.date).toBe('2026-10-10')
    expect(diary.entries.map((e) => e.id)).toEqual(['2'])
  })
})

describe('add', () => {
  it('appends the entry when it belongs to the visible day', async () => {
    diary.date = '2026-10-09'
    addEntry.mockResolvedValue(entry('1', 'lunch', 400, '2026-10-09'))
    await diary.add({})
    expect(diary.entries).toHaveLength(1)
  })

  it('does not show an entry logged for another day', async () => {
    diary.date = '2026-10-09'
    addEntry.mockResolvedValue(entry('1', 'lunch', 400, '2026-10-12'))
    await diary.add({})
    expect(diary.entries).toHaveLength(0)
  })
})

describe('update / remove', () => {
  it('replaces the entry with the updated copy', async () => {
    const original = entry('1', 'lunch', 400)
    diary.entries = [original]
    updateEntry.mockResolvedValue({ ...original, meal: 'dinner', totalCalories: 800 })
    await diary.update(original, { servings: 2, meal: 'dinner' })
    expect(diary.entries[0]).toMatchObject({ meal: 'dinner', totalCalories: 800 })
    expect(updateEntry).toHaveBeenCalledWith('u1', original, { servings: 2, meal: 'dinner' })
  })

  it('removes the entry after deleting it', async () => {
    const a = entry('1', 'lunch', 400)
    const b = entry('2', 'lunch', 100)
    diary.entries = [a, b]
    deleteEntry.mockResolvedValue()
    await diary.remove(a)
    expect(deleteEntry).toHaveBeenCalledWith('u1', '1')
    expect(diary.entries).toEqual([b])
  })

  it('keeps the entry when the delete fails', async () => {
    const a = entry('1', 'lunch', 400)
    diary.entries = [a]
    deleteEntry.mockRejectedValue(new Error('denied'))
    await expect(diary.remove(a)).rejects.toThrow('denied')
    expect(diary.entries).toEqual([a])
  })
})
