import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PlanSidebar from './PlanSidebar.vue'
import { allPlans } from '@/utils/nutrition'

const body = { gender: 'female', age: 30, weightLb: 160, heightIn: 65, activity: 'light' }
const plans = allPlans(body)

const render = (selected = -1) =>
  mount(PlanSidebar, { props: { plans, selected, maintenance: 1989 }, attachTo: document.body })

describe('PlanSidebar', () => {
  it('lists every weekly goal with its calories', () => {
    const wrapper = render()
    const options = wrapper.findAll('[role="radio"]')
    expect(options).toHaveLength(plans.length)
    expect(options[2].text()).toContain('Lose 1 lb/week')
    expect(options[2].text()).toContain('1489')
    wrapper.unmount()
  })

  it('shows the maintenance calories', () => {
    const wrapper = render()
    expect(wrapper.text()).toContain('1989')
    wrapper.unmount()
  })

  it('marks only the selected option as checked', () => {
    const wrapper = render(-1.5)
    const checked = wrapper
      .findAll('[role="radio"]')
      .filter((o) => o.attributes('aria-checked') === 'true')
    expect(checked).toHaveLength(1)
    expect(checked[0].text()).toContain('Lose 1.5 lb/week')
    wrapper.unmount()
  })

  it('emits the rate when an option is tapped', async () => {
    const wrapper = render()
    await wrapper.findAll('[role="radio"]')[0].trigger('click')
    expect(wrapper.emitted('select')[0]).toEqual([-2])
    wrapper.unmount()
  })

  it('explains when a pace was raised to the minimum', () => {
    const wrapper = render()
    expect(wrapper.text()).toContain('Raised to the 1200 kcal minimum')
    wrapper.unmount()
  })

  it('closes from the Done button, the close button, the backdrop and Escape', async () => {
    const wrapper = render()
    await wrapper.get('footer button').trigger('click')
    await wrapper.get('[aria-label="Close"]').trigger('click')
    await wrapper.get('.bg-black\\/40').trigger('click')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toHaveLength(4)
    wrapper.unmount()
  })

  it('stops listening for Escape once unmounted', () => {
    const wrapper = render()
    wrapper.unmount()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})
