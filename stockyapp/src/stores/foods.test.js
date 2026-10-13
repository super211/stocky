import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ uid: 'u1' }) }))
vi.mock('@/services/foods', () => ({
  listAllFoods: vi.fn(),
  searchFoods: vi.fn(),
  createFood: vi.fn(),
  updateFood: vi.fn(),
  deleteFood: vi.fn(),
}))

import { createFood, deleteFood, listAllFoods, searchFoods, updateFood } from '@/services/foods'
import { useFoodsStore } from './foods'

const food = (id, name = 'Food', calories = 100) => ({
  id,
  name,
  servingLabel: '1 serving',
  calories,
})

let store

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  store = useFoodsStore()
})

describe('loadAll', () => {
  it('loads the foods for the signed-in user', async () => {
    listAllFoods.mockResolvedValue([food('1'), food('2')])
    await store.loadAll()
    expect(listAllFoods).toHaveBeenCalledWith('u1')
    expect(store.foods).toHaveLength(2)
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
  })

  it('records the error message on failure', async () => {
    listAllFoods.mockRejectedValue(new Error('boom'))
    await store.loadAll()
    expect(store.error).toBe('boom')
    expect(store.loading).toBe(false)
  })

  it('falls back to a default message when the error has none', async () => {
    listAllFoods.mockRejectedValue({})
    await store.loadAll()
    expect(store.error).toBe('Could not load your foods.')
  })

  it('clears a previous error on a successful reload', async () => {
    listAllFoods.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce([])
    await store.loadAll()
    await store.loadAll()
    expect(store.error).toBe('')
  })
})

describe('search / create', () => {
  it('searches with the signed-in user and returns the results', async () => {
    searchFoods.mockResolvedValue([food('1', 'Apple')])
    await expect(store.search('app')).resolves.toEqual([food('1', 'Apple')])
    expect(searchFoods).toHaveBeenCalledWith('u1', 'app')
  })

  it('creates a food for the signed-in user', async () => {
    const created = food('9', 'Pear')
    createFood.mockResolvedValue(created)
    const input = { name: 'Pear', servingLabel: '1 serving', calories: 100 }
    await expect(store.create(input)).resolves.toEqual(created)
    expect(createFood).toHaveBeenCalledWith('u1', input)
  })
})

describe('update', () => {
  it('merges the updated fields into the loaded food', async () => {
    store.foods = [food('1', 'Apple', 95), food('2', 'Pear', 100)]
    updateFood.mockResolvedValue({ name: 'Green apple', calories: 80 })
    await store.update('1', { name: 'Green apple', calories: 80 })
    expect(updateFood).toHaveBeenCalledWith('u1', '1', { name: 'Green apple', calories: 80 })
    expect(store.foods[0]).toEqual({ ...food('1'), name: 'Green apple', calories: 80 })
    expect(store.foods[1].name).toBe('Pear')
  })

  it('leaves the list alone when the food is not loaded', async () => {
    store.foods = [food('1')]
    updateFood.mockResolvedValue({ name: 'Other' })
    await store.update('missing', { name: 'Other' })
    expect(store.foods).toEqual([food('1')])
  })
})

describe('remove', () => {
  it('removes the food after deleting it', async () => {
    store.foods = [food('1'), food('2')]
    deleteFood.mockResolvedValue()
    await store.remove('1')
    expect(deleteFood).toHaveBeenCalledWith('u1', '1')
    expect(store.foods.map((f) => f.id)).toEqual(['2'])
  })

  it('keeps the food when the delete fails', async () => {
    store.foods = [food('1')]
    deleteFood.mockRejectedValue(new Error('denied'))
    await expect(store.remove('1')).rejects.toThrow('denied')
    expect(store.foods).toHaveLength(1)
  })
})
