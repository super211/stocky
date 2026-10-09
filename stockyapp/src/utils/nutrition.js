const LB_TO_KG = 0.45359237
const IN_TO_CM = 2.54
// About 3500 kcal per pound of body weight, spread over 7 days.
const KCAL_PER_LB_PER_WEEK = 3500 / 7

export const GENDERS = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
]

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', hint: 'Little or no exercise', factor: 1.2 },
  { id: 'light', label: 'Lightly active', hint: 'Exercise 1–3 days a week', factor: 1.375 },
  { id: 'moderate', label: 'Moderately active', hint: 'Exercise 3–5 days a week', factor: 1.55 },
  { id: 'active', label: 'Very active', hint: 'Hard exercise 6–7 days a week', factor: 1.725 },
]

// Pounds per week; negative = lose, positive = gain.
export const WEEKLY_RATES = [-2, -1.5, -1, -0.5, 0, 0.5, 1]
export const DEFAULT_RATE = -1

export function rateLabel(rate) {
  if (rate === 0) return 'Maintain weight'
  const n = Math.abs(rate)
  return `${rate < 0 ? 'Lose' : 'Gain'} ${n} lb/week`
}

export function validateBody({ gender, age, weightLb, heightIn, activity }) {
  if (!GENDERS.some((g) => g.id === gender)) return 'Choose a gender.'
  if (!Number.isInteger(age) || age < 18 || age > 100) return 'Age must be between 18 and 100.'
  if (!Number.isFinite(weightLb) || weightLb < 50 || weightLb > 700) {
    return 'Weight must be between 50 and 700 lb.'
  }
  if (!Number.isFinite(heightIn) || heightIn < 36 || heightIn > 96) {
    return 'Height must be between 3 ft and 8 ft.'
  }
  if (!ACTIVITY_LEVELS.some((a) => a.id === activity)) return 'Choose an activity level.'
  return ''
}

// Mifflin-St Jeor equation, in kcal/day.
export function bmr({ gender, age, weightLb, heightIn }) {
  const base = 10 * weightLb * LB_TO_KG + 6.25 * heightIn * IN_TO_CM - 5 * age
  return base + (gender === 'male' ? 5 : -161)
}

export function maintenanceCalories(body) {
  const factor = ACTIVITY_LEVELS.find((a) => a.id === body.activity)?.factor ?? 1.2
  return Math.round(bmr(body) * factor)
}

// Common guidance: don't plan below 1200 (female) or 1500 (male) kcal/day without supervision.
export function minimumCalories(gender) {
  return gender === 'male' ? 1500 : 1200
}

export function planFor(body, rate) {
  const maintenance = maintenanceCalories(body)
  const target = maintenance + Math.round(rate * KCAL_PER_LB_PER_WEEK)
  const floor = minimumCalories(body.gender)
  return {
    rate,
    label: rateLabel(rate),
    calories: Math.max(target, floor),
    limited: target < floor,
    floor,
  }
}

export function allPlans(body) {
  return WEEKLY_RATES.map((rate) => planFor(body, rate))
}
