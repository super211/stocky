<script setup>
import { RouterLink } from 'vue-router'

const tabs = [
  {
    to: '/',
    label: 'Diary',
    icon: 'M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  },
  { to: '/foods', label: 'Foods', icon: 'M4 6h16M4 12h16M4 18h16' },
  { to: '/history', label: 'History', icon: 'M5 20V10m7 10V4m7 16v-7' },
  {
    to: '/settings',
    label: 'Settings',
    icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 00-2-1.2L14.5 3h-4l-.4 2.6a7.5 7.5 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 002 1.2l.4 2.6h4l.4-2.6a7.5 7.5 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  },
]
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-slate-200 bg-white"
    style="padding-bottom: env(safe-area-inset-bottom)"
    aria-label="Main"
  >
    <ul class="flex">
      <li v-for="tab in tabs" :key="tab.to" class="flex-1">
        <RouterLink
          :to="tab.to"
          class="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-slate-600"
          active-class="!text-green-800"
          exact-active-class="!text-green-800"
        >
          <svg
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="tab.icon" />
          </svg>
          {{ tab.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
