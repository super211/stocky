import { describe, expect, it } from 'vitest'
import { normalizeFood, validateFood } from './foods'

describe('normalizeFood', () => {
  it('trims text and rounds calories', () => {
    expect(
      normalizeFood({ name: '  Apple ', servingLabel: ' 1 medium ', calories: '95.4' }),
    ).toEqual({
      name: 'Apple',
      servingLabel: '1 medium',
      calories: 95,
    })
  })

  it('turns missing values into empty strings and NaN calories', () => {
    const food = normalizeFood({})
    expect(food.name).toBe('')
    expect(food.servingLabel).toBe('')
    expect(food.calories).toBeNaN()
  })
})

describe('validateFood', () => {
  const valid = { name: 'Apple', servingLabel: '1 medium', calories: 95 }

  it('accepts a valid food, including 0 calories', () => {
    expect(validateFood(valid)).toBe('')
    expect(validateFood({ ...valid, calories: 0 })).toBe('')
  })

  it('rejects an empty or too long name', () => {
    expect(validateFood({ ...valid, name: '' })).toMatch(/Name/)
    expect(validateFood({ ...valid, name: 'x'.repeat(61) })).toMatch(/Name/)
    expect(validateFood({ ...valid, name: 'x'.repeat(60) })).toBe('')
  })

  it('requires a serving description', () => {
    expect(validateFood({ ...valid, servingLabel: '' })).toMatch(/Serving/)
  })

  it('rejects negative or non-numeric calories', () => {
    expect(validateFood({ ...valid, calories: -1 })).toMatch(/Calories/)
    expect(validateFood({ ...valid, calories: NaN })).toMatch(/Calories/)
  })
})
