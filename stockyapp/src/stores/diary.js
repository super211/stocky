import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { addEntry, deleteEntry, listEntriesByDate, updateEntry } from '@/services/entries'
import { MEAL_IDS, sumCalories } from '@/utils/calories'
import { todayStr } from '@/utils/date'

export const useDiaryStore = defineStore('diary', {
  state: () => ({
    date: todayStr(),
    entries: [],
    loading: false,
    error: '',
  }),
  getters: {
    total: (s) => sumCalories(s.entries),
    byMeal: (s) =>
      Object.fromEntries(MEAL_IDS.map((id) => [id, s.entries.filter((e) => e.meal === id)])),
    mealTotal() {
      return (meal) => sumCalories(this.byMeal[meal] ?? [])
    },
  },
  actions: {
    async load(date = this.date) {
      const uid = useAuthStore().uid
      this.date = date
      this.loading = true
      this.error = ''
      try {
        const entries = await listEntriesByDate(uid, date)
        // Ignore the result if the user already moved to another day.
        if (this.date === date) this.entries = entries
      } catch (e) {
        if (this.date === date) {
          this.entries = []
          this.error = e?.message || 'Could not load your diary.'
        }
      } finally {
        if (this.date === date) this.loading = false
      }
    },
    async add(payload) {
      const entry = await addEntry(useAuthStore().uid, payload)
      if (entry.date === this.date) this.entries.push(entry)
      return entry
    },
    async update(entry, changes) {
      const updated = await updateEntry(useAuthStore().uid, entry, changes)
      const i = this.entries.findIndex((e) => e.id === entry.id)
      if (i !== -1) this.entries[i] = updated
    },
    async remove(entry) {
      await deleteEntry(useAuthStore().uid, entry.id)
      this.entries = this.entries.filter((e) => e.id !== entry.id)
    },
    reset() {
      this.$reset()
    },
  },
})
