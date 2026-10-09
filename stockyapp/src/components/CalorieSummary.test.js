import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CalorieSummary from './CalorieSummary.vue'

const render = (goal, food) => mount(CalorieSummary, { props: { goal, food } })

describe('CalorieSummary', () => {
  it('shows goal, food and remaining calories', () => {
    const wrapper = render(2000, 750)
    const text = wrapper.text()
    expect(text).toContain('2000')
    expect(text).toContain('750')
    expect(text).toContain('1250')
    expect(text).toContain('Remaining')
  })

  it('sets the progress bar to the percentage eaten', () => {
    const bar = render(2000, 500).get('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('25')
    expect(bar.get('div').attributes('style')).toContain('width: 25%')
  })

  it('shows how far over the goal the user is, in red', () => {
    const wrapper = render(1500, 1800)
    expect(wrapper.text()).toContain('Over')
    expect(wrapper.text()).toContain('300')
    expect(wrapper.text()).not.toContain('Remaining')
    expect(wrapper.html()).toContain('text-red-700')
  })

  it('caps the progress bar at 100% when over the goal', () => {
    const bar = render(1500, 3000).get('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('100')
  })

  it('treats exactly reaching the goal as 0 remaining, not over', () => {
    const wrapper = render(2000, 2000)
    expect(wrapper.text()).toContain('Remaining')
    expect(wrapper.text()).not.toContain('Over')
  })
})
