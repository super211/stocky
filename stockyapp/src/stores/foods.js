import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { createFood, deleteFood, listAllFoods, searchFoods, updateFood } from '@/services/foods'

export const useFoodsStore = defineStore('foods', {
  state: () => ({
    foods: [],
    loading: false,
    error: '',
  }),
  actions: {
    async loadAll() {
      this.loading = true
      this.error = ''
      try {
        this.foods = await listAllFoods(useAuthStore().uid)
      } catch (e) {
        this.error = e?.message || 'Could not load your foods.'
      } finally {
        this.loading = false
      }
    },
    search(text) {
      return searchFoods(useAuthStore().uid, text)
    },
    async create(input) {
      return createFood(useAuthStore().uid, input)
    },
    async update(id, input) {
      const food = await updateFood(useAuthStore().uid, id, input)
      const i = this.foods.findIndex((f) => f.id === id)
      if (i !== -1) this.foods[i] = { ...this.foods[i], ...food }
      return food
    },
    async remove(id) {
      await deleteFood(useAuthStore().uid, id)
      this.foods = this.foods.filter((f) => f.id !== id)
    },
  },
})
