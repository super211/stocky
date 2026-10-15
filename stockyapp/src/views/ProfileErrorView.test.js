import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const auth = vi.hoisted(() => ({
  profileError: 'Failed to get document because the client is offline.',
  loadProfile: vi.fn(),
  logout: vi.fn(),
}))
const router = vi.hoisted(() => ({ replace: vi.fn() }))

vi.mock('@/stores/auth', () => ({ useAuthStore: () => auth }))
vi.mock('vue-router', () => ({ useRouter: () => router }))

import ProfileErrorView from './ProfileErrorView.vue'

const buttonWith = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().includes(text))

beforeEach(() => {
  vi.clearAllMocks()
  auth.profileError = 'Failed to get document because the client is offline.'
  auth.loadProfile.mockResolvedValue()
  auth.logout.mockResolvedValue()
})

describe('ProfileErrorView', () => {
  it('shows the reason the profile could not be loaded', () => {
    const wrapper = mount(ProfileErrorView)
    expect(wrapper.get('[role="alert"]').text()).toContain('client is offline')
  })

  it('goes to the diary after a retry that succeeds', async () => {
    auth.loadProfile.mockImplementation(async () => {
      auth.profileError = ''
    })
    const wrapper = mount(ProfileErrorView)
    await buttonWith(wrapper, 'Try again').trigger('click')
    await flushPromises()
    expect(auth.loadProfile).toHaveBeenCalledOnce()
    expect(router.replace).toHaveBeenCalledWith({ name: 'diary' })
  })

  it('stays put when the retry fails again', async () => {
    const wrapper = mount(ProfileErrorView)
    await buttonWith(wrapper, 'Try again').trigger('click')
    await flushPromises()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('can log out', async () => {
    const wrapper = mount(ProfileErrorView)
    await buttonWith(wrapper, 'Log out').trigger('click')
    await flushPromises()
    expect(auth.logout).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith({ name: 'login' })
  })
})
