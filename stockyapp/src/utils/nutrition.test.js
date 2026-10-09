import { describe, expect, it } from 'vitest'
import {
  WEEKLY_RATES,
  allPlans,
  bmr,
  maintenanceCalories,
  minimumCalories,
  planFor,
  rateLabel,
  validateBody,
} from './nutrition'

const woman = { gender: 'female', age: 30, weightLb: 160, heightIn: 65, activity: 'light' }
const man = { gender: 'male', age: 35, weightLb: 200, heightIn: 70, activity: 'sedentary' }

describe('bmr (Mifflin-St Jeor)', () => {
  it('matches a hand calculation for a woman', () => {
    // 10 * 72.5748 + 6.25 * 165.1 - 5 * 30 - 161
    expect(bmr(woman)).toBeCloseTo(1446.6, 0)
  })

  it('is 166 kcal higher for a man with otherwise equal stats', () => {
    expect(bmr({ ...woman, gender: 'male' }) - bmr(woman)).toBeCloseTo(166, 5)
  })
})

describe('maintenanceCalories', () => {
  it('applies the activity factor', () => {
    expect(maintenanceCalories(woman)).toBe(1989)
    expect(maintenanceCalories(man)).toBe(2218)
  })

  it('increases with activity level', () => {
    const levels = ['sedentary', 'light', 'moderate', 'active']
    const values = levels.map((activity) => maintenanceCalories({ ...woman, activity }))
    expect(values).toEqual([...values].sort((a, b) => a - b))
    expect(new Set(values).size).toBe(4)
  })
})

describe('minimumCalories', () => {
  it('is 1200 for women and 1500 for men', () => {
    expect(minimumCalories('female')).toBe(1200)
    expect(minimumCalories('male')).toBe(1500)
  })
})

describe('rateLabel', () => {
  it('describes losing, gaining and maintaining', () => {
    expect(rateLabel(-1)).toBe('Lose 1 lb/week')
    expect(rateLabel(-1.5)).toBe('Lose 1.5 lb/week')
    expect(rateLabel(0.5)).toBe('Gain 0.5 lb/week')
    expect(rateLabel(0)).toBe('Maintain weight')
  })
})

describe('planFor', () => {
  it('equals maintenance when the rate is 0', () => {
    expect(planFor(woman, 0)).toMatchObject({ calories: 1989, limited: false })
  })

  it('changes by 500 kcal per pound per week', () => {
    expect(planFor(woman, -1).calories).toBe(1989 - 500)
    expect(planFor(woman, -0.5).calories).toBe(1989 - 250)
    expect(planFor(woman, 1).calories).toBe(1989 + 500)
  })

  it('never goes below the floor and flags the plan as limited', () => {
    const plan = planFor(woman, -2)
    expect(plan.calories).toBe(1200)
    expect(plan.limited).toBe(true)
    expect(plan.floor).toBe(1200)
  })

  it('uses the higher floor for men', () => {
    const plan = planFor(man, -2)
    expect(plan.calories).toBe(1500)
    expect(plan.limited).toBe(true)
  })

  it('does not flag a plan that lands exactly on or above the floor', () => {
    expect(planFor(man, -1).limited).toBe(false)
  })
})

describe('allPlans', () => {
  it('returns one plan per weekly rate, ordered from fastest loss to gain', () => {
    const plans = allPlans(woman)
    expect(plans.map((p) => p.rate)).toEqual(WEEKLY_RATES)
    const calories = plans.map((p) => p.calories)
    expect(calories).toEqual([...calories].sort((a, b) => a - b))
  })
})

describe('validateBody', () => {
  it('accepts valid details', () => {
    expect(validateBody(woman)).toBe('')
  })

  it.each([
    [{ gender: '' }, 'gender'],
    [{ gender: 'other' }, 'gender'],
    [{ age: 17 }, 'Age'],
    [{ age: 101 }, 'Age'],
    [{ age: 30.5 }, 'Age'],
    [{ age: NaN }, 'Age'],
    [{ weightLb: 49 }, 'Weight'],
    [{ weightLb: 701 }, 'Weight'],
    [{ weightLb: NaN }, 'Weight'],
    [{ heightIn: 35 }, 'Height'],
    [{ heightIn: 97 }, 'Height'],
    [{ activity: 'couch' }, 'activity'],
  ])('rejects %j', (override, expected) => {
    expect(validateBody({ ...woman, ...override })).toContain(expected)
  })
})
