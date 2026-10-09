<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PlanSidebar from '@/components/PlanSidebar.vue'
import { useAuthStore } from '@/stores/auth'
import {
  ACTIVITY_LEVELS,
  DEFAULT_RATE,
  GENDERS,
  allPlans,
  maintenanceCalories,
  planFor,
  validateBody,
} from '@/utils/nutrition'

const auth = useAuthStore()
const router = useRouter()

// Prefill from a saved profile so "Update my plan" starts from the current answers.
const saved = auth.profile ?? {}
const isEditing = !auth.needsSetup

const step = ref(1)
const gender = ref(saved.gender ?? '')
const age = ref(saved.age ? String(saved.age) : '')
const weight = ref(saved.weightLb ? String(saved.weightLb) : '')
const feet = ref(saved.heightIn ? String(Math.floor(saved.heightIn / 12)) : '')
const inches = ref(saved.heightIn ? String(Math.round(saved.heightIn % 12)) : '')
const activity = ref(saved.activity ?? 'light')
const rate = ref(saved.weeklyChangeLb ?? DEFAULT_RATE)

const error = ref('')
const saving = ref(false)
const sidebarOpen = ref(false)

function readBody() {
  return {
    gender: gender.value,
    age: Number(age.value),
    weightLb: Number(weight.value),
    heightIn: Number(feet.value) * 12 + Number(inches.value || 0),
    activity: activity.value,
  }
}

const body = ref(readBody())
const plans = computed(() => allPlans(body.value))
const plan = computed(() => planFor(body.value, rate.value))
const maintenance = computed(() => maintenanceCalories(body.value))

function next() {
  const current = readBody()
  const problem = validateBody(current)
  if (problem) {
    error.value = problem
    return
  }
  error.value = ''
  body.value = current
  step.value = 2
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    await auth.saveOnboarding({
      ...body.value,
      weeklyChangeLb: rate.value,
      dailyGoal: plan.value.calories,
    })
    router.replace({ name: 'diary' })
  } catch (e) {
    error.value = e?.message || 'Could not save your plan. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="px-6 py-8">
    <p class="text-sm font-semibold text-green-800">Step {{ step }} of 2</p>

    <form v-if="step === 1" class="mt-1 space-y-5" @submit.prevent="next">
      <div>
        <h1 class="text-2xl font-bold">About you</h1>
        <p class="mt-1 text-slate-600">
          We use this to estimate how many calories you burn each day.
        </p>
      </div>

      <fieldset>
        <legend class="label">Gender</legend>
        <div class="grid grid-cols-2 gap-2">
          <label
            v-for="g in GENDERS"
            :key="g.id"
            class="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 font-semibold"
            :class="
              gender === g.id
                ? 'border-green-700 bg-green-50 ring-1 ring-green-700'
                : 'border-slate-300 bg-white'
            "
          >
            <input v-model="gender" class="sr-only" type="radio" name="gender" :value="g.id" />
            {{ g.label }}
          </label>
        </div>
        <p class="mt-1 text-xs text-slate-600">Used only in the calorie formula.</p>
      </fieldset>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label" for="age">Age</label>
          <input
            id="age"
            v-model="age"
            class="input"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            required
          />
        </div>
        <div>
          <label class="label" for="weight">Weight (lb)</label>
          <input
            id="weight"
            v-model="weight"
            class="input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            required
          />
        </div>
      </div>

      <fieldset>
        <legend class="label">Height</legend>
        <div class="grid grid-cols-2 gap-3">
          <div class="relative">
            <input
              v-model="feet"
              class="input pr-10"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              aria-label="Height, feet"
              required
            />
            <span class="absolute inset-y-0 right-3 flex items-center text-slate-600">ft</span>
          </div>
          <div class="relative">
            <input
              v-model="inches"
              class="input pr-10"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              aria-label="Height, inches"
            />
            <span class="absolute inset-y-0 right-3 flex items-center text-slate-600">in</span>
          </div>
        </div>
      </fieldset>

      <div>
        <label class="label" for="activity">Activity level</label>
        <select id="activity" v-model="activity" class="input">
          <option v-for="a in ACTIVITY_LEVELS" :key="a.id" :value="a.id">
            {{ a.label }} — {{ a.hint }}
          </option>
        </select>
      </div>

      <p v-if="error" class="error-text" role="alert">{{ error }}</p>
      <button class="btn btn-primary w-full" type="submit">Next</button>
      <button
        v-if="isEditing"
        class="btn-ghost w-full"
        type="button"
        @click="router.replace({ name: 'settings' })"
      >
        Cancel
      </button>
    </form>

    <section v-else class="mt-1 space-y-5">
      <div>
        <h1 class="text-2xl font-bold">Your daily calories</h1>
        <p class="mt-1 text-slate-600">Based on how much weight you want to change each week.</p>
      </div>

      <div class="card p-5 text-center" aria-live="polite">
        <p class="text-sm font-semibold text-slate-600">{{ plan.label }}</p>
        <p class="mt-1 text-5xl font-bold text-green-800">{{ plan.calories }}</p>
        <p class="text-sm text-slate-600">calories per day</p>
        <p v-if="plan.limited" class="mt-3 text-sm text-amber-800">
          That pace would go below {{ plan.floor }} kcal a day, so we raised it to the minimum.
          Consider a slower pace.
        </p>
      </div>

      <button class="btn btn-secondary w-full" type="button" @click="sidebarOpen = true">
        Compare weekly goals
      </button>

      <p class="text-xs text-slate-600">
        This is an estimate (Mifflin-St Jeor formula, about 3,500 kcal per pound). It is not medical
        advice. Talk to a doctor before starting a weight-loss plan.
      </p>

      <p v-if="error" class="error-text" role="alert">{{ error }}</p>
      <div class="flex gap-2">
        <button class="btn btn-secondary flex-1" type="button" :disabled="saving" @click="step = 1">
          Back
        </button>
        <button class="btn btn-primary flex-1" type="button" :disabled="saving" @click="save">
          Save plan
        </button>
      </div>
    </section>

    <PlanSidebar
      v-if="sidebarOpen"
      :plans="plans"
      :selected="rate"
      :maintenance="maintenance"
      @select="rate = $event"
      @close="sidebarOpen = false"
    />
  </main>
</template>
