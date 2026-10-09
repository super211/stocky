<script setup>
import { ref } from 'vue'
import { DEFAULT_GOAL } from '@/utils/calories'

const props = defineProps({
  initial: { type: Number, default: DEFAULT_GOAL },
  submitLabel: { type: String, default: 'Save' },
  // Async function that receives the goal; throw to show an error.
  save: { type: Function, required: true },
})

const goal = ref(String(props.initial))
const error = ref('')
const busy = ref(false)

async function submit() {
  const n = Math.round(Number(goal.value))
  if (!Number.isFinite(n) || n < 1 || n > 20000) {
    error.value = 'Enter a goal between 1 and 20,000 calories.'
    return
  }
  error.value = ''
  busy.value = true
  try {
    await props.save(n)
  } catch (e) {
    error.value = e?.message || 'Could not save your goal.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div>
      <label class="label" for="goal">Daily calorie goal</label>
      <input
        id="goal"
        v-model="goal"
        class="input"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        required
      />
    </div>
    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <button class="btn btn-primary w-full" type="submit" :disabled="busy">
      {{ submitLabel }}
    </button>
  </form>
</template>
