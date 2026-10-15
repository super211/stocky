<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const busy = ref(false)

async function retry() {
  busy.value = true
  try {
    await auth.loadProfile()
    // The route guard sends the user to the diary, or to onboarding if they truly have no profile.
    if (!auth.profileError) router.replace({ name: 'diary' })
  } finally {
    busy.value = false
  }
}

async function logout() {
  await auth.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <main class="flex min-h-dvh flex-col justify-center px-6 py-10">
    <h1 class="text-2xl font-bold">Couldn’t load your profile</h1>
    <p class="mt-2 text-slate-600">
      You are signed in, but we couldn’t reach your saved data. Check your connection and try again.
      Your account and settings have not been changed.
    </p>
    <p class="error-text mt-3 break-words" role="alert">{{ auth.profileError }}</p>
    <button class="btn btn-primary mt-6 w-full" :disabled="busy" @click="retry">Try again</button>
    <button class="btn btn-secondary mt-3 w-full" :disabled="busy" @click="logout">Log out</button>
  </main>
</template>
