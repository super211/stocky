<script setup>
import { formatServings } from '@/utils/calories'

defineProps({ entry: { type: Object, required: true } })
defineEmits(['select'])
</script>

<template>
  <button
    class="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left active:bg-slate-100"
    type="button"
    @click="$emit('select', entry)"
  >
    <span class="min-w-0">
      <span class="block truncate font-medium">{{ entry.name }}</span>
      <span class="block truncate text-sm text-slate-600">
        {{ formatServings(entry.servings) }} × {{ entry.servingLabel }}
      </span>
    </span>
    <span class="shrink-0 font-semibold">{{ entry.totalCalories }}</span>
  </button>
</template>
