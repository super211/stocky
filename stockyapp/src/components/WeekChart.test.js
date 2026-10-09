import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WeekChart from './WeekChart.vue'
import { lastDays } from '@/utils/date'

const dates = lastDays(7, '2026-10-09')
const totals = [1800, 0, 2100, 1500, 0, 2500, 1900]
const days = dates.map((date, i) => ({ date, total: totals[i] }))

const render = (goal = 2000) => mount(WeekChart, { props: { days, goal } })

describe('WeekChart', () => {
  it('draws a tappable target for each of the 7 days', () => {
    expect(render().findAll('[role="button"]')).toHaveLength(7)
  })

  it('labels days with their totals for screen readers', () => {
    const labels = render()
      .findAll('[role="button"]')
      .map((t) => t.attributes('aria-label'))
    expect(labels[0]).toContain('1800 calories')
    expect(labels[1]).toContain('0 calories')
  })

  it('shows the goal line label', () => {
    expect(render(2000).text()).toContain('Goal 2000')
  })

  it('colors days over the goal red and others green', () => {
    const bars = render(2000).findAll('rect[rx="3"]')
    const colors = bars.map((b) => (b.classes('fill-red-600') ? 'over' : 'ok'))
    expect(colors).toEqual(['ok', 'ok', 'over', 'ok', 'ok', 'over', 'ok'])
  })

  it('draws no height for days with nothing logged', () => {
    const bars = render().findAll('rect[rx="3"]')
    expect(Number(bars[1].attributes('height'))).toBe(0)
    expect(Number(bars[2].attributes('height'))).toBeGreaterThan(0)
  })

  it('scales bar heights in proportion to calories', () => {
    const bars = render().findAll('rect[rx="3"]')
    const h = (i) => Number(bars[i].attributes('height'))
    expect(h(5) / h(3)).toBeCloseTo(2500 / 1500, 5)
  })

  it('emits the date of the tapped day', async () => {
    const wrapper = render()
    await wrapper.findAll('[role="button"]')[2].trigger('click')
    expect(wrapper.emitted('select')[0]).toEqual([dates[2]])
  })
})
