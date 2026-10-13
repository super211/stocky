import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import BottomTabBar from './BottomTabBar.vue'

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: ['/', '/foods', '/history', '/settings'].map((path) => ({
      path,
      component: { template: '<div />' },
    })),
  })

async function render(path = '/') {
  const router = makeRouter()
  router.push(path)
  await router.isReady()
  return mount(BottomTabBar, { global: { plugins: [router] } })
}

describe('BottomTabBar', () => {
  it('shows the four main tabs in order', async () => {
    const wrapper = await render()
    expect(wrapper.findAll('a').map((a) => a.text())).toEqual([
      'Diary',
      'Foods',
      'History',
      'Settings',
    ])
  })

  it('links each tab to its route', async () => {
    const wrapper = await render()
    expect(wrapper.findAll('a').map((a) => a.attributes('href'))).toEqual([
      '/',
      '/foods',
      '/history',
      '/settings',
    ])
  })

  it('is labelled as the main navigation', async () => {
    const wrapper = await render()
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Main')
  })

  it('marks only the current route tab as active', async () => {
    const wrapper = await render('/foods')
    const active = wrapper.findAll('a').filter((a) => a.classes('!text-green-800'))
    expect(active.map((a) => a.text())).toEqual(['Foods'])
  })
})
