<script setup>
import { computed } from 'vue'
import { formatDateLabel, shiftDate } from '@/utils/date'

const props = defineProps({ date: { type: String, required: true } })
const emit = defineEmits(['change'])

const label = computed(() => formatDateLabel(props.date))

function onPick(e) {
  if (e.target.value) emit('change', e.target.value)
}
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <button
      class="btn btn-secondary !px-3"
      type="button"
      aria-label="Previous day"
      @click="emit('change', shiftDate(date, -1))"
    >
      ‹
    </button>

    <label class="relative flex min-h-11 flex-1 cursor-pointer items-center justify-center">
      <span class="text-lg font-bold">{{ label }}</span>
      <!-- Native picker sits invisibly over the label so a tap opens it -->
      <input
        type="date"
        class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        :value="date"
        aria-label="Pick a date"
        @change="onPick"
      />
    </label>

    <button
      class="btn btn-secondary !px-3"
      type="button"
      aria-label="Next day"
      @click="emit('change', shiftDate(date, 1))"
    >
      ›
    </button>
  </div>
</template>
