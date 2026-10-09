<script setup>
import { computed, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { firebaseConfigured } from '@/services/firebase'
import BottomTabBar from '@/components/BottomTabBar.vue'

const ready = ref(false)
const route = useRoute()
const showTabs = computed(() => Boolean(route.meta.tabs))

if (firebaseConfigured) {
  useRouter()
    .isReady()
    .then(() => (ready.value = true))
}
</script>

<template>
  <main v-if="!firebaseConfigured" class="mx-auto max-w-md p-6">
    <h1 class="text-2xl font-bold">Firebase is not configured</h1>
    <p class="mt-3 text-slate-700">
      Copy <code class="rounded bg-slate-200 px-1">.env.example</code> to
      <code class="rounded bg-slate-200 px-1">.env.local</code>, fill in your Firebase web app
      settings, then restart the dev server.
    </p>
  </main>

  <div v-else-if="!ready" class="grid min-h-dvh place-items-center" role="status">
    <span class="text-lg font-semibold text-green-800">Stocky…</span>
  </div>

  <div v-else class="mx-auto flex min-h-dvh max-w-md flex-col bg-slate-50">
    <div class="flex-1" :class="showTabs ? 'pb-24' : ''">
      <RouterView />
    </div>
    <BottomTabBar v-if="showTabs" />
  </div>
</template>
