<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

defineProps({
  plans: { type: Array, required: true }, // from allPlans()
  selected: { type: Number, required: true }, // selected rate
  maintenance: { type: Number, required: true },
})
const emit = defineEmits(['select', 'close'])

const closeButton = ref(null)

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => {
  document.addEventListener('keydown', onKey)
  closeButton.value?.focus()
})
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="fixed inset-0 z-40">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>
    <aside
      class="absolute inset-y-0 right-0 flex w-80 max-w-[88%] flex-col bg-white shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Compare weekly goals"
    >
      <header class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 class="text-lg font-bold">Weekly goal</h2>
        <button
          ref="closeButton"
          class="btn-ghost"
          type="button"
          aria-label="Close"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <div class="flex-1 overflow-y-auto px-4 py-3">
        <p class="text-sm text-slate-600">
          Tap an option to see your daily calories. To maintain your weight you would eat about
          {{ maintenance }} kcal a day.
        </p>
        <div class="mt-3 space-y-2" role="radiogroup" aria-label="Weekly goal">
          <button
            v-for="p in plans"
            :key="p.rate"
            type="button"
            role="radio"
            :aria-checked="p.rate === selected"
            class="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left"
            :class="
              p.rate === selected
                ? 'border-green-700 bg-green-50 ring-1 ring-green-700'
                : 'border-slate-300 bg-white active:bg-slate-100'
            "
            @click="emit('select', p.rate)"
          >
            <span>
              <span class="block font-semibold">{{ p.label }}</span>
              <span v-if="p.limited" class="block text-xs text-amber-800">
                Raised to the {{ p.floor }} kcal minimum
              </span>
            </span>
            <span class="shrink-0 text-right">
              <span class="block text-lg font-bold">{{ p.calories }}</span>
              <span class="block text-xs text-slate-600">kcal/day</span>
            </span>
          </button>
        </div>
      </div>

      <footer class="pb-safe border-t border-slate-200 px-4 pt-3">
        <button class="btn btn-primary w-full" type="button" @click="emit('close')">Done</button>
      </footer>
    </aside>
  </div>
</template>
