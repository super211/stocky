<script setup>
import { ref } from 'vue'
import { normalizeFood, validateFood } from '@/services/foods'

const props = defineProps({
  initial: { type: Object, default: () => ({ name: '', servingLabel: '', calories: '' }) },
  submitLabel: { type: String, default: 'Save' },
  // Async function that receives the normalized food; throw to show an error.
  save: { type: Function, required: true },
})
const emit = defineEmits(['cancel'])

const name = ref(props.initial.name)
const servingLabel = ref(props.initial.servingLabel)
const calories = ref(String(props.initial.calories ?? ''))
const error = ref('')
const busy = ref(false)

async function submit() {
  const food = normalizeFood({
    name: name.value,
    servingLabel: servingLabel.value,
    calories: calories.value,
  })
  const problem = validateFood(food)
  if (problem) {
    error.value = problem
    return
  }
  error.value = ''
  busy.value = true
  try {
    await props.save(food)
  } catch (e) {
    error.value = e?.message || 'Could not save this food.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div>
      <label class="label" for="food-name">Name</label>
      <input
        id="food-name"
        v-model="name"
        class="input"
        type="text"
        maxlength="60"
        autocomplete="off"
        required
      />
    </div>
    <div>
      <label class="label" for="food-serving">Serving (e.g. 1 slice, 100 g)</label>
      <input
        id="food-serving"
        v-model="servingLabel"
        class="input"
        type="text"
        maxlength="40"
        autocomplete="off"
        required
      />
    </div>
    <div>
      <label class="label" for="food-calories">Calories per serving</label>
      <input
        id="food-calories"
        v-model="calories"
        class="input"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        required
      />
    </div>
    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    <div class="flex gap-2">
      <button
        class="btn btn-secondary flex-1"
        type="button"
        :disabled="busy"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button class="btn btn-primary flex-1" type="submit" :disabled="busy">
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>
