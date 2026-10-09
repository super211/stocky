import { describe, expect, it } from 'vitest'
import {
  MAX_SERVINGS,
  MEALS,
  MEAL_IDS,
  MIN_SERVINGS,
  clampServings,
  formatServings,
  mealLabel,
  sumCalories,
  totalFor,
} from './calories'

describe('meals', () => {
  it('has the four meals in diary order', () => {
    expect(MEAL_IDS).toEqual(['breakfast', 'lunch', 'dinner', 'snacks'])
    expect(MEALS).toHaveLength(4)
  })

  it('mealLabel maps ids to labels and passes unknown ids through', () => {
    expect(mealLabel('snacks')).toBe('Snacks')
    expect(mealLabel('brunch')).toBe('brunch')
  })
})

describe('totalFor', () => {
  it('multiplies and rounds to a whole number', () => {
    expect(totalFor(100, 1)).toBe(100)
    expect(totalFor(95, 0.5)).toBe(48)
    expect(totalFor(333, 0.25)).toBe(83)
    expect(totalFor(0, 3)).toBe(0)
  })
})

describe('sumCalories', () => {
  it('adds totalCalories and treats missing values as 0', () => {
    expect(sumCalories([{ totalCalories: 100 }, { totalCalories: 250 }, {}])).toBe(350)
  })

  it('returns 0 for an empty list', () => {
    expect(sumCalories([])).toBe(0)
  })
})

describe('clampServings', () => {
  it('snaps to quarter steps', () => {
    expect(clampServings(1.1)).toBe(1)
    expect(clampServings(1.2)).toBe(1.25)
    expect(clampServings('2.5')).toBe(2.5)
  })

  it('enforces the minimum and maximum', () => {
    expect(clampServings(0)).toBe(MIN_SERVINGS)
    expect(clampServings(-5)).toBe(MIN_SERVINGS)
    expect(clampServings(500)).toBe(MAX_SERVINGS)
  })

  it('falls back to 1 for non-numeric input', () => {
    expect(clampServings('abc')).toBe(1)
    expect(clampServings(NaN)).toBe(1)
    expect(clampServings(Infinity)).toBe(1)
  })
})

describe('formatServings', () => {
  it('drops trailing zeros', () => {
    expect(formatServings(2)).toBe('2')
    expect(formatServings(1.5)).toBe('1.5')
    expect(formatServings(0.25)).toBe('0.25')
  })
})
