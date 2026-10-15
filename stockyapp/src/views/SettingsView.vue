<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { planFor, rateLabel, validateBody } from '@/utils/nutrition'
import GoalForm from '@/components/GoalForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useDiaryStore } from '@/stores/diary'
import { useFoodsStore } from '@/stores/foods'
import { useThemeStore } from '@/stores/theme'

const auth = useAuthStore()
const diary = useDiaryStore()
const foods = useFoodsStore()
const theme = useThemeStore()

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]
const router = useRouter()
const saved = ref(false)

// The weekly rate only describes the goal while the goal still equals what that plan calculates.
// After a manual goal it would be misleading, so show "Manual goal" instead.
const isManualGoal = computed(() => {
  const p = auth.profile
  if (p?.weeklyChangeLb === undefined || validateBody(p)) return false
  return planFor(p, p.weeklyChangeLb).calories !== auth.dailyGoal
})
const loggingOut = ref(false)

async function save(goal) {
  saved.value = false
  await auth.setDailyGoal(goal)
  saved.value = true
}

async function logout() {
  loggingOut.value = true
  try {
    await auth.logout()
    // Don't leave this user's data in memory for whoever signs in next.
    diary.reset()
    foods.$reset()
    router.replace({ name: 'login' })
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div>
    <header class="px-4 pt-6 pb-2">
      <h1 class="text-2xl font-bold">Settings</h1>
    </header>

    <section class="card mx-4 mt-4 p-4">
      <h2 class="label">Your plan</h2>
      <p v-if="auth.profile?.weeklyChangeLb !== undefined" class="text-slate-800">
        {{ isManualGoal ? 'Manual goal' : rateLabel(auth.profile.weeklyChangeLb) }} ·
        <strong>{{ auth.dailyGoal }} kcal/day</strong>
      </p>
      <RouterLink to="/setup" class="btn btn-secondary mt-3 w-full">
        Update my plan or compare goals
      </RouterLink>
    </section>

    <section class="card mx-4 mt-4 p-4">
      <h2 class="label">Set calories manually</h2>
      <GoalForm :initial="auth.dailyGoal ?? 2000" submit-label="Save goal" :save="save" />
      <p v-if="saved" class="mt-3 text-sm text-green-800" role="status">Goal saved.</p>
    </section>

    <section class="card mx-4 mt-4 p-4">
      <fieldset>
        <legend class="label">Appearance</legend>
        <div class="grid grid-cols-3 gap-2">
          <label v-for="o in THEME_OPTIONS" :key="o.value" class="block">
            <input
              type="radio"
              name="theme"
              class="peer sr-only"
              :value="o.value"
              :checked="theme.theme === o.value"
              @change="theme.setTheme(o.value)"
            />
            <span
              class="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-2 font-semibold text-slate-800 peer-checked:border-green-700 peer-checked:bg-green-50 peer-checked:ring-1 peer-checked:ring-green-700 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-green-700 dark:peer-focus-visible:outline-green-400"
            >
              {{ o.label }}
            </span>
          </label>
        </div>
      </fieldset>
      <p class="mt-2 text-sm text-slate-600">System follows your device setting.</p>
      <p v-if="theme.error" class="error-text mt-2" role="alert">{{ theme.error }}</p>
    </section>

    <section class="card mx-4 mt-4 p-4">
      <h2 class="label">Account</h2>
      <p class="break-all text-slate-800">{{ auth.user?.email }}</p>
      <button class="btn btn-secondary mt-4 w-full" :disabled="loggingOut" @click="logout">
        Log out
      </button>
    </section>
  </div>
</template>
