import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ServingsSheet from './ServingsSheet.vue'

function render(props = {}) {
  return mount(ServingsSheet, {
    props: {
      title: 'Rice',
      servingLabel: '1 cup',
      caloriesPerServing: 200,
      meal: 'lunch',
      onConfirm: vi.fn().mockResolvedValue(),
      ...props,
    },
  })
}

const buttonWith = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().includes(text))

describe('ServingsSheet', () => {
  it('shows the food and the starting total for 1 serving', () => {
    const wrapper = render()
    expect(wrapper.text()).toContain('Rice')
    expect(wrapper.text()).toContain('200 kcal per 1 cup')
    expect(wrapper.text()).toContain('200 kcal')
    expect(wrapper.get('#servings').element.value).toBe('1')
  })

  it('changes servings in quarter steps and updates the total', async () => {
    const wrapper = render()
    await wrapper.get('[aria-label="More servings"]').trigger('click')
    expect(wrapper.get('#servings').element.value).toBe('1.25')
    expect(wrapper.text()).toContain('250 kcal')
    await wrapper.get('[aria-label="Fewer servings"]').trigger('click')
    await wrapper.get('[aria-label="Fewer servings"]').trigger('click')
    expect(wrapper.get('#servings').element.value).toBe('0.75')
    expect(wrapper.text()).toContain('150 kcal')
  })

  it('does not go below the minimum serving', () => {
    const wrapper = render({ initialServings: 0.25 })
    expect(wrapper.get('[aria-label="Fewer servings"]').attributes('disabled')).toBeDefined()
  })

  it('updates the total as the user types a number', async () => {
    const wrapper = render()
    await wrapper.get('#servings').setValue('2')
    expect(wrapper.text()).toContain('400 kcal')
  })

  it('confirms with the chosen servings and meal, then closes', async () => {
    const onConfirm = vi.fn().mockResolvedValue()
    const wrapper = render({ onConfirm, confirmLabel: 'Add to diary' })
    await wrapper.get('[aria-label="More servings"]').trigger('click')
    await wrapper.get('#meal').setValue('dinner')
    await buttonWith(wrapper, 'Add to diary').trigger('click')
    await flushPromises()
    expect(onConfirm).toHaveBeenCalledWith({ servings: 1.25, meal: 'dinner' })
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('shows the error and stays open when confirming fails', async () => {
    const wrapper = render({ onConfirm: vi.fn().mockRejectedValue(new Error('Permission denied')) })
    await buttonWith(wrapper, 'Add').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Permission denied')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('hides delete unless allowed', () => {
    expect(buttonWith(render(), 'Delete')).toBeUndefined()
  })

  it('asks to confirm before deleting', async () => {
    const onDelete = vi.fn().mockResolvedValue()
    const wrapper = render({ canDelete: true, onDelete })
    await buttonWith(wrapper, 'Delete entry').trigger('click')
    expect(onDelete).not.toHaveBeenCalled()
    await buttonWith(wrapper, 'Keep').trigger('click')
    expect(buttonWith(wrapper, 'Delete entry')).toBeDefined()

    await buttonWith(wrapper, 'Delete entry').trigger('click')
    await buttonWith(wrapper, 'Yes, delete').trigger('click')
    await flushPromises()
    expect(onDelete).toHaveBeenCalledOnce()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes on Cancel', async () => {
    const wrapper = render()
    await buttonWith(wrapper, 'Cancel').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
