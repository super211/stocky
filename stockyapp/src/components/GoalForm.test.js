import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import GoalForm from './GoalForm.vue'

const render = (props = {}) =>
  mount(GoalForm, { props: { save: vi.fn().mockResolvedValue(), ...props } })

describe('GoalForm', () => {
  it('starts with the initial goal, defaulting to 2000', () => {
    expect(render().get('#goal').element.value).toBe('2000')
    expect(render({ initial: 1650 }).get('#goal').element.value).toBe('1650')
  })

  it('saves the goal as a whole number', async () => {
    const save = vi.fn().mockResolvedValue()
    const wrapper = render({ save })
    await wrapper.get('#goal').setValue('1800.6')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(save).toHaveBeenCalledWith(1801)
  })

  it.each(['0', '-5', 'abc', '20001'])('rejects %s', async (value) => {
    const save = vi.fn()
    const wrapper = render({ save })
    await wrapper.get('#goal').setValue(value)
    await wrapper.get('form').trigger('submit')
    expect(save).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toMatch(/between 1 and 20,000/)
  })

  it('shows an error when saving fails', async () => {
    const wrapper = render({ save: vi.fn().mockRejectedValue(new Error('offline')) })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('offline')
  })
})
