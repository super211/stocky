import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DateSwitcher from './DateSwitcher.vue'

const render = (date = '2026-10-09') => mount(DateSwitcher, { props: { date } })

describe('DateSwitcher', () => {
  it('moves one day back and forward', async () => {
    const wrapper = render()
    await wrapper.get('[aria-label="Previous day"]').trigger('click')
    await wrapper.get('[aria-label="Next day"]').trigger('click')
    expect(wrapper.emitted('change')).toEqual([['2026-10-08'], ['2026-10-10']])
  })

  it('crosses month boundaries', async () => {
    const wrapper = render('2026-03-01')
    await wrapper.get('[aria-label="Previous day"]').trigger('click')
    expect(wrapper.emitted('change')[0]).toEqual(['2026-02-28'])
  })

  it('emits the date picked in the date input', async () => {
    const wrapper = render()
    await wrapper.get('input[type="date"]').setValue('2026-09-15')
    expect(wrapper.emitted('change')[0]).toEqual(['2026-09-15'])
  })

  it('ignores clearing the date input', async () => {
    const wrapper = render()
    await wrapper.get('input[type="date"]').setValue('')
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('shows the current date in the picker', () => {
    expect(render().get('input[type="date"]').element.value).toBe('2026-10-09')
  })
})
