<script setup>
import EntryRow from './EntryRow.vue'

defineProps({
  label: { type: String, required: true },
  entries: { type: Array, required: true },
  total: { type: Number, required: true },
})
defineEmits(['add', 'select'])
</script>

<template>
  <section class="card overflow-hidden">
    <header class="flex items-center justify-between bg-slate-100 px-4 py-2">
      <h2 class="font-bold">{{ label }}</h2>
      <span class="text-sm font-semibold text-slate-700">{{ total }} kcal</span>
    </header>
    <ul v-if="entries.length" class="divide-y divide-slate-100">
      <li v-for="e in entries" :key="e.id">
        <EntryRow :entry="e" @select="$emit('select', $event)" />
      </li>
    </ul>
    <p v-else class="px-4 py-3 text-sm text-slate-600">Nothing logged yet.</p>
    <button class="btn-ghost w-full border-t border-slate-100 text-left" @click="$emit('add')">
      + Add food
    </button>
  </section>
</template>
