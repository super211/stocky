import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  isSignedIn: false,
  needsSetup: false,
  init: () => Promise.resolve(),
}))

vi.mock('@/stores/auth', () => ({ useAuthStore: () => auth }))

// The guard is under test, not the screens, so stub every lazy view.
const stub = { default: { template: '<div />' } }
vi.mock('@/views/LoginView.vue', () => stub)
vi.mock('@/views/SetupView.vue', () => stub)
vi.mock('@/views/DiaryView.vue', () => stub)
vi.mock('@/views/AddFoodView.vue', () => stub)
vi.mock('@/views/FoodsView.vue', () => stub)
vi.mock('@/views/HistoryView.vue', () => stub)
vi.mock('@/views/SettingsView.vue', () => stub)

import router from './index'

async function go(path) {
  await router.push(path)
  return router.currentRoute.value.name
}

beforeEach(async () => {
  auth.isSignedIn = false
  auth.needsSetup = false
  // Park the router on a neutral, public route between tests.
  await router.replace('/login')
})

describe('signed out', () => {
  it('sends protected routes to login', async () => {
    expect(await go('/')).toBe('login')
    expect(await go('/foods')).toBe('login')
    expect(await go('/settings')).toBe('login')
    expect(await go('/setup')).toBe('login')
  })

  it('allows the login page', async () => {
    expect(await go('/login')).toBe('login')
  })
})

describe('signed in and onboarded', () => {
  beforeEach(() => {
    auth.isSignedIn = true
  })

  it('opens the protected routes', async () => {
    expect(await go('/')).toBe('diary')
    expect(await go('/foods')).toBe('foods')
    expect(await go('/history')).toBe('history')
    expect(await go('/settings')).toBe('settings')
    expect(await go('/add?meal=lunch')).toBe('add')
  })

  it('redirects away from the login page', async () => {
    // Start elsewhere: pushing the current route again would skip the guard entirely.
    await go('/foods')
    expect(await go('/login')).toBe('diary')
  })

  it('lets the user revisit setup to update their plan', async () => {
    expect(await go('/setup')).toBe('setup')
  })

  it('sends unknown paths to the diary', async () => {
    expect(await go('/nope/nothing')).toBe('diary')
  })
})

describe('signed in but not onboarded', () => {
  beforeEach(() => {
    auth.isSignedIn = true
    auth.needsSetup = true
  })

  it('forces every other screen to onboarding', async () => {
    expect(await go('/')).toBe('setup')
    expect(await go('/foods')).toBe('setup')
    expect(await go('/settings')).toBe('setup')
  })

  it('allows the setup screen itself', async () => {
    expect(await go('/setup')).toBe('setup')
  })
})
