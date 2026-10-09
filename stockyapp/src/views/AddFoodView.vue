<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FoodForm from '@/components/FoodForm.vue'
import ServingsSheet from '@/components/ServingsSheet.vue'
import { useDiaryStore } from '@/stores/diary'
import { useFoodsStore } from '@/stores/foods'
import { MEAL_IDS, mealLabel } from '@/utils/calories'
import { isValidDateStr, todayStr } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const foods = useFoodsStore()
const diary = useDiaryStore()

const meal = computed(() => (MEAL_IDS.includes(route.query.meal) ? route.query.meal : 'breakfast'))
const date = computed(() =>
  typeof route.query.date === 'string' && isValidDateStr(route.query.date)
    ? route.query.date
    : todayStr(),
)

const search = ref('')
const results = ref([])
const loading = ref(false)
const error = ref('')
const creating = ref(false)
const selected = ref(null)

let timer = null
let requestId = 0

async function runSearch() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const found = await foods.search(search.value)
    if (id === requestId) results.value = found
  } catch (e) {
    if (id === requestId) error.value = e?.message || 'Could not load foods.'
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(runSearch, 250)
})
onMounted(runSearch)
onBeforeUnmount(() => clearTimeout(timer))

const heading = computed(() => (search.value.trim() ? 'Results' : 'Recent foods'))

function back() {
  router.replace({ name: 'diary', query: date.value === todayStr() ? {} : { date: date.value } })
}

async function createFood(food) {
  selected.value = await foods.create(food)
  creating.value = false
}

async function log({ servings, meal: chosenMeal }) {
  await diary.add({ food: selected.value, date: date.value, meal: chosenMeal, servings })
  back()
}
</script>

<template>
  <div class="px-4 pt-4">
    <header class="flex items-center gap-2">
      <button class="btn btn-secondary !px-3" aria-label="Back to diary" @click="back">‹</button>
      <div class="min-w-0">
        <h1 class="truncate text-xl font-bold">Add to {{ mealLabel(meal) }}</h1>
      </div>
    </header>

    <template v-if="creating">
      <section class="card mt-4 p-4">
        <h2 class="mb-3 text-lg font-bold">New food</h2>
        <FoodForm
          :initial="{ name: search.trim(), servingLabel: '', calories: '' }"
          submit-label="Save and continue"
          :save="createFood"
          @cancel="creating = false"
        />
      </section>
    </template>

    <template v-else>
      <div class="mt-4">
        <label class="label" for="search">Search your foods</label>
        <input
          id="search"
          v-model="search"
          class="input"
          type="search"
          placeholder="Start typing a name"
          autocomplete="off"
        />
      </div>

      <h2 class="mt-5 mb-2 text-sm font-bold tracking-wide text-slate-600 uppercase">
        {{ heading }}
      </h2>

      <div v-if="error" class="card p-4" role="alert">
        <p class="error-text">{{ error }}</p>
        <button class="btn btn-secondary mt-3" @click="runSearch">Try again</button>
      </div>

      <p v-else-if="loading && !results.length" class="text-sm text-slate-600" role="status">
        Loading…
      </p>

      <ul v-else-if="results.length" class="card divide-y divide-slate-100 overflow-hidden">
        <li v-for="f in results" :key="f.id">
          <button
            class="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left active:bg-slate-100"
            @click="selected = f"
          >
            <span class="min-w-0">
              <span class="block truncate font-medium">{{ f.name }}</span>
              <span class="block truncate text-sm text-slate-600">{{ f.servingLabel }}</span>
            </span>
            <span class="shrink-0 font-semibold">{{ f.calories }}</span>
          </button>
        </li>
      </ul>

      <p v-else class="card p-4 text-slate-700">
        {{
          search.trim()
            ? `No saved food starts with "${search.trim()}".`
            : 'You have no saved foods yet. Create your first one below.'
        }}
      </p>

      <button class="btn btn-primary mt-4 w-full" @click="creating = true">
        {{ search.trim() ? `Create "${search.trim()}"` : 'Create new food' }}
      </button>
    </template>

    <ServingsSheet
      v-if="selected"
      :key="selected.id"
      :title="selected.name"
      :serving-label="selected.servingLabel"
      :calories-per-serving="selected.calories"
      :meal="meal"
      confirm-label="Add to diary"
      :on-confirm="log"
      @close="selected = null"
    />
  </div>
</template>
