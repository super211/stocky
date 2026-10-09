export const MEALS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snacks', label: 'Snacks' },
]

export const MEAL_IDS = MEALS.map((m) => m.id)

export const SERVING_STEP = 0.25
export const MIN_SERVINGS = 0.25
export const MAX_SERVINGS = 99
export const DEFAULT_GOAL = 2000

export function mealLabel(id) {
  return MEALS.find((m) => m.id === id)?.label ?? id
}

export function totalFor(caloriesPerServing, servings) {
  return Math.round(caloriesPerServing * servings)
}

export function sumCalories(entries) {
  return entries.reduce((sum, e) => sum + (e.totalCalories || 0), 0)
}

export function clampServings(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  const stepped = Math.round(n / SERVING_STEP) * SERVING_STEP
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, stepped))
}

export function formatServings(n) {
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)))
}
