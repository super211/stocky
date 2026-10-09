<script setup>
import { computed } from 'vue'

const props = defineProps({
  goal: { type: Number, required: true },
  food: { type: Number, required: true },
})

const remaining = computed(() => props.goal - props.food)
const over = computed(() => remaining.value < 0)
const percent = computed(() => Math.min(100, Math.round((props.food / props.goal) * 100)))
</script>

<template>
  <section class="card p-4" aria-label="Calorie summary">
    <div class="flex items-end justify-between text-center">
      <div>
        <p class="text-2xl font-bold">{{ goal }}</p>
        <p class="text-xs font-semibold text-slate-600">Goal</p>
      </div>
      <span class="pb-5 text-xl text-slate-500" aria-hidden="true">−</span>
      <div>
        <p class="text-2xl font-bold">{{ food }}</p>
        <p class="text-xs font-semibold text-slate-600">Food</p>
      </div>
      <span class="pb-5 text-xl text-slate-500" aria-hidden="true">=</span>
      <div>
        <p class="text-2xl font-bold" :class="over ? 'text-red-700' : 'text-green-800'">
          {{ Math.abs(remaining) }}
        </p>
        <p class="text-xs font-semibold" :class="over ? 'text-red-700' : 'text-slate-600'">
          {{ over ? 'Over' : 'Remaining' }}
        </p>
      </div>
    </div>
    <div
      class="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Calories eaten compared with goal"
    >
      <div
        class="h-full rounded-full"
        :class="over ? 'bg-red-600' : 'bg-green-600'"
        :style="{ width: percent + '%' }"
      ></div>
    </div>
  </section>
</template>
