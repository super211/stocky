<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import WeekChart from '@/components/WeekChart.vue'
import { listEntriesInRange } from '@/services/entries'
import { useAuthStore } from '@/stores/auth'
import { sumCalories } from '@/utils/calories'
import { lastDays, todayStr } from '@/utils/date'

const auth = useAuthStore()
const router = useRouter()

const days = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const dates = lastDays(7)
    const entries = await listEntriesInRange(auth.uid, dates[0], dates[dates.length - 1])
    days.value = dates.map((date) => ({
      date,
      total: sumCalories(entries.filter((e) => e.date === date)),
    }))
  } catch (e) {
    error.value = e?.message || 'Could not load your history.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const loggedDays = computed(() => days.value.filter((d) => d.total > 0))
const average = computed(() =>
  loggedDays.value.length
    ? Math.round(loggedDays.value.reduce((s, d) => s + d.total, 0) / loggedDays.value.length)
    : 0,
)

function open(date) {
  router.push({ name: 'diary', query: date === todayStr() ? {} : { date } })
}
</script>

<template>
  <div class="px-4 pt-6">
    <h1 class="text-2xl font-bold">Last 7 days</h1>

    <div v-if="error" class="card mt-4 p-4" role="alert">
      <p class="error-text">{{ error }}</p>
      <button class="btn btn-secondary mt-3" @click="load">Try again</button>
    </div>

    <p v-else-if="loading" class="mt-4 text-sm text-slate-600" role="status">Loading…</p>

    <template v-else>
      <section class="card mt-4 p-3">
        <WeekChart :days="days" :goal="auth.dailyGoal" @select="open" />
      </section>

      <p v-if="!loggedDays.length" class="card mt-4 p-4 text-slate-700">
        Nothing logged in the last 7 days. Add food from the Diary tab to see your trend.
      </p>
      <p v-else class="mt-4 text-slate-700">
        Average on days you logged: <strong>{{ average }}</strong> kcal (goal {{ auth.dailyGoal }}).
        Tap a bar to open that day.
      </p>
    </template>
  </div>
</template>
