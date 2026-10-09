<script setup>
import { computed, onMounted, ref } from 'vue'
import FoodForm from '@/components/FoodForm.vue'
import { useFoodsStore } from '@/stores/foods'

const foods = useFoodsStore()

const filter = ref('')
const editing = ref(null) // a food being edited, or { id: null } for a new one
const deleting = ref(null)
const deleteError = ref('')

onMounted(() => foods.loadAll())

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  return q ? foods.foods.filter((f) => f.nameLower.includes(q)) : foods.foods
})

async function save(food) {
  if (editing.value.id) await foods.update(editing.value.id, food)
  else {
    await foods.create(food)
    await foods.loadAll()
  }
  editing.value = null
}

function askDelete(food) {
  deleting.value = food
  deleteError.value = ''
}

async function confirmDelete() {
  deleteError.value = ''
  try {
    await foods.remove(deleting.value.id)
    deleting.value = null
  } catch (e) {
    deleteError.value = e?.message || 'Could not delete this food.'
  }
}
</script>

<template>
  <div class="px-4 pt-6">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">My foods</h1>
      <button
        v-if="!editing"
        class="btn btn-primary"
        @click="editing = { id: null, name: '', servingLabel: '', calories: '' }"
      >
        + New
      </button>
    </header>

    <section v-if="editing" class="card mt-4 p-4">
      <h2 class="mb-3 text-lg font-bold">{{ editing.id ? 'Edit food' : 'New food' }}</h2>
      <FoodForm
        :key="editing.id ?? 'new'"
        :initial="editing"
        :submit-label="editing.id ? 'Save changes' : 'Create food'"
        :save="save"
        @cancel="editing = null"
      />
    </section>

    <template v-else>
      <input
        v-model="filter"
        class="input mt-4"
        type="search"
        placeholder="Filter foods"
        aria-label="Filter foods"
        autocomplete="off"
      />

      <div v-if="foods.error" class="card mt-4 p-4" role="alert">
        <p class="error-text">{{ foods.error }}</p>
        <button class="btn btn-secondary mt-3" @click="foods.loadAll()">Try again</button>
      </div>

      <p
        v-else-if="foods.loading && !foods.foods.length"
        class="mt-4 text-sm text-slate-600"
        role="status"
      >
        Loading…
      </p>

      <p v-else-if="!foods.foods.length" class="card mt-4 p-4 text-slate-700">
        Your food library is empty. Tap “+ New” to add a food, or create one while logging a meal.
      </p>

      <p v-else-if="!filtered.length" class="card mt-4 p-4 text-slate-700">No foods match.</p>

      <ul v-else class="card mt-4 divide-y divide-slate-100 overflow-hidden">
        <li v-for="f in filtered" :key="f.id" class="flex items-center gap-2 pr-2">
          <button
            class="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 px-4 py-2 text-left active:bg-slate-100"
            @click="editing = f"
          >
            <span class="min-w-0">
              <span class="block truncate font-medium">{{ f.name }}</span>
              <span class="block truncate text-sm text-slate-600">{{ f.servingLabel }}</span>
            </span>
            <span class="shrink-0 font-semibold">{{ f.calories }}</span>
          </button>
          <button
            class="min-h-11 min-w-11 rounded-xl text-red-700 active:bg-red-50"
            :aria-label="`Delete ${f.name}`"
            @click="askDelete(f)"
          >
            ✕
          </button>
        </li>
      </ul>
    </template>

    <div v-if="deleting" class="fixed inset-0 z-30 flex items-end justify-center">
      <div class="absolute inset-0 bg-black/40" @click="deleting = null"></div>
      <div
        class="pb-safe relative w-full max-w-md rounded-t-3xl bg-white px-5 pt-5"
        role="alertdialog"
        aria-modal="true"
        aria-label="Delete food"
      >
        <h2 class="text-lg font-bold">Delete “{{ deleting.name }}”?</h2>
        <p class="mt-1 text-sm text-slate-600">
          Past diary entries that used this food are not changed.
        </p>
        <p v-if="deleteError" class="error-text mt-2" role="alert">{{ deleteError }}</p>
        <div class="mt-4 flex gap-2">
          <button class="btn btn-secondary flex-1" @click="deleting = null">Cancel</button>
          <button class="btn btn-danger flex-1" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
