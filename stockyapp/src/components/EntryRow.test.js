import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EntryRow from './EntryRow.vue'

const entry = {
  id: 'e1',
  name: 'Apple',
  servings: 1.5,
  servingLabel: '1 medium',
  totalCalories: 143,
}

const render = (overrides = {}) => mount(EntryRow, { props: { entry: { ...entry, ...overrides } } })

describe('EntryRow', () => {
  it('shows the name, servings and total calories', () => {
    const text = render().text()
    expect(text).toContain('Apple')
    expect(text).toContain('1.5 × 1 medium')
    expect(text).toContain('143')
  })

  it('shows whole servings without decimals', () => {
    expect(render({ servings: 2 }).text()).toContain('2 × 1 medium')
  })

  it('rounds long fractional servings to two decimals', () => {
    expect(render({ servings: 0.3333333 }).text()).toContain('0.33 × 1 medium')
  })

  it('emits select with the entry when clicked', async () => {
    const wrapper = render()
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('select')).toEqual([[entry]])
  })
})
