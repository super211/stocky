<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CalorieSummary from '@/components/CalorieSummary.vue'
import DateSwitcher from '@/components/DateSwitcher.vue'
import MealSection from '@/components/MealSection.vue'
import ServingsSheet from '@/components/ServingsSheet.vue'
import { useAuthStore } from '@/stores/auth'
import { useDiaryStore } from '@/stores/diary'
import { MEALS } from '@/utils/calories'
import { isValidDateStr, todayStr } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const diary = useDiaryStore()

const editing = ref(null)

const date = computed(() => {
  const q = route.query.date
  return typeof q === 'string' && isValidDateStr(q) ? q : todayStr()
})

watch(date, (d) => diary.load(d), { immediate: true })

function changeDate(d) {
  router.replace({ name: 'diary', query: d === todayStr() ? {} : { date: d } })
}

function addTo(meal) {
  router.push({ name: 'add', query: { meal, date: date.value } })
}

const save = (changes) => diary.update(editing.value, changes)
const remove = () => diary.remove(editing.value)
</script>

<template>
  <div>
    <header class="px-4 pt-4">
      <DateSwitcher :date="date" @change="changeDate" />
    </header>

    <div class="mt-4 space-y-4 px-4">
      <CalorieSummary :goal="auth.dailyGoal" :food="diary.total" />

      <div v-if="diary.error" class="card p-4" role="alert">
        <p class="error-text">{{ diary.error }}</p>
        <button class="btn btn-secondary mt-3" @click="diary.load(date)">Try again</button>
      </div>

      <template v-else>
        <p v-if="diary.loading" class="text-center text-sm text-slate-600" role="status">
          Loading…
        </p>
        <MealSection
          v-for="m in MEALS"
          :key="m.id"
          :label="m.label"
          :entries="diary.byMeal[m.id]"
          :total="diary.mealTotal(m.id)"
          @add="addTo(m.id)"
          @select="editing = $event"
        />
      </template>
    </div>

    <ServingsSheet
      v-if="editing"
      :key="editing.id"
      :title="editing.name"
      :serving-label="editing.servingLabel"
      :calories-per-serving="editing.caloriesPerServing"
      :initial-servings="editing.servings"
      :meal="editing.meal"
      confirm-label="Save changes"
      can-delete
      :on-confirm="save"
      :on-delete="remove"
      @close="editing = null"
    />
  </div>
</template>
