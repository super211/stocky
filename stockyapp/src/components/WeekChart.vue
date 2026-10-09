<script setup>
import { computed } from 'vue'
import { formatWeekday } from '@/utils/date'

const props = defineProps({
  days: { type: Array, required: true }, // [{ date, total }], oldest first
  goal: { type: Number, required: true },
})
const emit = defineEmits(['select'])

const W = 320
const H = 180
const PAD = { top: 12, bottom: 28, side: 8 }

const max = computed(() => Math.max(props.goal, ...props.days.map((d) => d.total), 1) * 1.1)
const plotH = H - PAD.top - PAD.bottom
const slot = (W - PAD.side * 2) / props.days.length
const barW = slot * 0.6

const y = (v) => PAD.top + plotH - (v / max.value) * plotH

const bars = computed(() =>
  props.days.map((d, i) => ({
    ...d,
    x: PAD.side + slot * i + (slot - barW) / 2,
    y: y(d.total),
    h: (d.total / max.value) * plotH,
    over: d.total > props.goal,
    label: formatWeekday(d.date),
  })),
)
</script>

<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    class="w-full"
    role="group"
    aria-label="Calories for the last 7 days"
  >
    <line
      :x1="PAD.side"
      :x2="W - PAD.side"
      :y1="y(goal)"
      :y2="y(goal)"
      stroke="currentColor"
      class="text-slate-500"
      stroke-dasharray="4 3"
    />
    <text :x="W - PAD.side" :y="y(goal) - 3" text-anchor="end" font-size="9" class="fill-slate-600">
      Goal {{ goal }}
    </text>
    <g v-for="b in bars" :key="b.date">
      <rect
        :x="b.x"
        :y="b.y"
        :width="barW"
        :height="Math.max(b.h, 0)"
        rx="3"
        :class="b.over ? 'fill-red-600' : 'fill-green-600'"
      />
      <text
        v-if="b.total"
        :x="b.x + barW / 2"
        :y="b.y - 3"
        text-anchor="middle"
        font-size="9"
        class="fill-slate-800"
      >
        {{ b.total }}
      </text>
      <text
        :x="b.x + barW / 2"
        :y="H - 10"
        text-anchor="middle"
        font-size="10"
        class="fill-slate-700"
      >
        {{ b.label }}
      </text>
      <!-- Transparent full-height target so each day is easy to tap -->
      <rect
        :x="b.x - (slot - barW) / 2"
        y="0"
        :width="slot"
        :height="H"
        fill="transparent"
        tabindex="0"
        role="button"
        :aria-label="`${b.label}: ${b.total} calories. Open day`"
        class="cursor-pointer"
        @click="emit('select', b.date)"
        @keydown.enter="emit('select', b.date)"
      />
    </g>
  </svg>
</template>
