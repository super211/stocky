<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  MAX_SERVINGS,
  MEALS,
  MIN_SERVINGS,
  SERVING_STEP,
  clampServings,
  formatServings,
  totalFor,
} from '@/utils/calories'

const props = defineProps({
  title: { type: String, required: true },
  servingLabel: { type: String, required: true },
  caloriesPerServing: { type: Number, required: true },
  initialServings: { type: Number, default: 1 },
  meal: { type: String, required: true },
  confirmLabel: { type: String, default: 'Add' },
  canDelete: { type: Boolean, default: false },
  // Async handlers; throw to show an error inside the sheet.
  onConfirm: { type: Function, required: true },
  onDelete: { type: Function, default: null },
})
const emit = defineEmits(['close'])

const servings = ref(clampServings(props.initialServings))
const meal = ref(props.meal)
const busy = ref(false)
const error = ref('')
const confirmingDelete = ref(false)

const total = computed(() => totalFor(props.caloriesPerServing, servings.value))

function step(delta) {
  servings.value = clampServings(servings.value + delta)
}

function onType(e) {
  const n = Number(e.target.value)
  if (Number.isFinite(n) && n > 0) servings.value = Math.min(MAX_SERVINGS, n)
}

function onBlur(e) {
  servings.value = clampServings(servings.value)
  e.target.value = formatServings(servings.value)
}

async function run(fn) {
  busy.value = true
  error.value = ''
  try {
    await fn()
    emit('close')
  } catch (e) {
    error.value = e?.message || 'Something went wrong. Please try again.'
    confirmingDelete.value = false
  } finally {
    busy.value = false
  }
}

const confirm = () => run(() => props.onConfirm({ servings: servings.value, meal: meal.value }))
const remove = () => run(() => props.onDelete())

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="fixed inset-0 z-30 flex items-end justify-center">
    <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>
    <div
      class="pb-safe relative w-full max-w-md rounded-t-3xl bg-white px-5 pt-5 shadow-xl"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <h2 class="truncate text-lg font-bold">{{ title }}</h2>
      <p class="text-sm text-slate-600">{{ caloriesPerServing }} kcal per {{ servingLabel }}</p>

      <div class="mt-4">
        <label class="label" for="servings">Servings</label>
        <div class="flex items-center gap-2">
          <button
            class="btn btn-secondary !px-4"
            type="button"
            aria-label="Fewer servings"
            :disabled="servings <= MIN_SERVINGS"
            @click="step(-SERVING_STEP)"
          >
            −
          </button>
          <input
            id="servings"
            class="input text-center"
            type="text"
            inputmode="decimal"
            :value="formatServings(servings)"
            @input="onType"
            @blur="onBlur"
          />
          <button
            class="btn btn-secondary !px-4"
            type="button"
            aria-label="More servings"
            :disabled="servings >= MAX_SERVINGS"
            @click="step(SERVING_STEP)"
          >
            +
          </button>
        </div>
      </div>

      <div class="mt-4">
        <label class="label" for="meal">Meal</label>
        <select id="meal" v-model="meal" class="input">
          <option v-for="m in MEALS" :key="m.id" :value="m.id">{{ m.label }}</option>
        </select>
      </div>

      <p class="mt-4 text-center text-2xl font-bold text-green-800">{{ total }} kcal</p>
      <p v-if="error" class="error-text mt-2" role="alert">{{ error }}</p>

      <div class="mt-4 space-y-2">
        <button class="btn btn-primary w-full" :disabled="busy" @click="confirm">
          {{ confirmLabel }}
        </button>
        <template v-if="canDelete">
          <button
            v-if="!confirmingDelete"
            class="btn btn-secondary w-full !text-red-700"
            :disabled="busy"
            @click="confirmingDelete = true"
          >
            Delete entry
          </button>
          <div v-else class="flex gap-2">
            <button
              class="btn btn-secondary flex-1"
              :disabled="busy"
              @click="confirmingDelete = false"
            >
              Keep
            </button>
            <button class="btn btn-danger flex-1" :disabled="busy" @click="remove">
              Yes, delete
            </button>
          </div>
        </template>
        <button class="btn-ghost w-full" :disabled="busy" @click="emit('close')">Cancel</button>
      </div>
    </div>
  </div>
</template>
