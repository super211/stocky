<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { rateLabel } from '@/utils/nutrition'
import GoalForm from '@/components/GoalForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useDiaryStore } from '@/stores/diary'

const auth = useAuthStore()
const diary = useDiaryStore()
const router = useRouter()
const saved = ref(false)
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
    diary.reset()
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
        {{ rateLabel(auth.profile.weeklyChangeLb) }} ·
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
      <h2 class="label">Account</h2>
      <p class="break-all text-slate-800">{{ auth.user?.email }}</p>
      <button class="btn btn-secondary mt-4 w-full" :disabled="loggingOut" @click="logout">
        Log out
      </button>
    </section>
  </div>
</template>
