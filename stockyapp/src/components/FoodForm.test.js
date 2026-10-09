import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import FoodForm from './FoodForm.vue'

const render = (props = {}) =>
  mount(FoodForm, { props: { save: vi.fn().mockResolvedValue(), ...props } })

async function fill(wrapper, { name, serving, calories }) {
  await wrapper.get('#food-name').setValue(name)
  await wrapper.get('#food-serving').setValue(serving)
  await wrapper.get('#food-calories').setValue(calories)
}

describe('FoodForm', () => {
  it('prefills from the initial food', () => {
    const wrapper = render({ initial: { name: 'Apple', servingLabel: '1 medium', calories: 95 } })
    expect(wrapper.get('#food-name').element.value).toBe('Apple')
    expect(wrapper.get('#food-serving').element.value).toBe('1 medium')
    expect(wrapper.get('#food-calories').element.value).toBe('95')
  })

  it('saves a trimmed, normalized food', async () => {
    const save = vi.fn().mockResolvedValue()
    const wrapper = render({ save })
    await fill(wrapper, { name: '  Toast ', serving: ' 1 slice ', calories: '80.4' })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(save).toHaveBeenCalledWith({ name: 'Toast', servingLabel: '1 slice', calories: 80 })
  })

  it('shows a validation error and does not save', async () => {
    const save = vi.fn()
    const wrapper = render({ save })
    await fill(wrapper, { name: 'Toast', serving: '1 slice', calories: 'lots' })
    await wrapper.get('form').trigger('submit')
    expect(save).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toMatch(/Calories/)
  })

  it('shows the error thrown by save, such as a duplicate food', async () => {
    const save = vi.fn().mockRejectedValue(new Error('You already have a food with this name'))
    const wrapper = render({ save })
    await fill(wrapper, { name: 'Toast', serving: '1 slice', calories: '80' })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('already have a food')
  })

  it('emits cancel', async () => {
    const wrapper = render()
    await wrapper.findAll('button')[0].trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
