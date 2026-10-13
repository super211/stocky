import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MealSection from './MealSection.vue'

const entries = [
  { id: 'e1', name: 'Oatmeal', servings: 1, servingLabel: '1 bowl', totalCalories: 300 },
  { id: 'e2', name: 'Banana', servings: 2, servingLabel: '1 medium', totalCalories: 210 },
]

const render = (props = {}) =>
  mount(MealSection, { props: { label: 'Breakfast', entries, total: 510, ...props } })

describe('MealSection', () => {
  it('shows the meal label and total calories', () => {
    const wrapper = render()
    expect(wrapper.get('h2').text()).toBe('Breakfast')
    expect(wrapper.text()).toContain('510 kcal')
  })

  it('renders one row per entry', () => {
    const wrapper = render()
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).toContain('Oatmeal')
    expect(wrapper.text()).toContain('Banana')
  })

  it('shows an empty message when there are no entries', () => {
    const wrapper = render({ entries: [], total: 0 })
    expect(wrapper.find('ul').exists()).toBe(false)
    expect(wrapper.text()).toContain('Nothing logged yet.')
    expect(wrapper.text()).toContain('0 kcal')
  })

  it('emits select with the entry that was clicked', async () => {
    const wrapper = render()
    await wrapper.findAll('li button')[1].trigger('click')
    expect(wrapper.emitted('select')).toEqual([[entries[1]]])
  })

  it('emits add when the add button is clicked', async () => {
    const wrapper = render()
    const addButton = wrapper.findAll('button').find((b) => b.text().includes('Add food'))
    await addButton.trigger('click')
    expect(wrapper.emitted('add')).toHaveLength(1)
  })
})
