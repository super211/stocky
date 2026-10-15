import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

const auth = vi.hoisted(() => ({ state: null }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => auth.state }))

import { useThemeStore } from './theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  setActivePinia(createPinia())
  auth.state = reactive({
    user: { uid: 'u1' },
    profile: { onboarded: true },
    setTheme: vi.fn().mockResolvedValue(),
  })
})

describe('theme store', () => {
  it('starts from localStorage', () => {
    localStorage.setItem('stocky.theme', 'dark')
    setActivePinia(createPinia())
    expect(useThemeStore().theme).toBe('dark')
  })

  it('applies instantly, mirrors to localStorage and saves to the profile', async () => {
    const store = useThemeStore()
    await store.setTheme('dark')
    expect(store.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('stocky.theme')).toBe('dark')
    expect(auth.state.setTheme).toHaveBeenCalledWith('dark')
    expect(store.error).toBe('')
  })

  it('keeps the local choice and exposes an error when saving fails', async () => {
    auth.state.setTheme.mockRejectedValue(new Error('offline'))
    const store = useThemeStore()
    await store.setTheme('dark')
    expect(store.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(store.error).toMatch(/save/i)
    await store.setTheme('light')
    expect(store.theme).toBe('light')
  })

  it('ignores invalid themes and skips saving when signed out', async () => {
    const store = useThemeStore()
    await store.setTheme('neon')
    expect(store.theme).toBe('system')
    auth.state.user = null
    await store.setTheme('light')
    expect(auth.state.setTheme).not.toHaveBeenCalled()
    expect(store.theme).toBe('light')
  })

  it('lets the loaded profile theme win and updates localStorage', async () => {
    localStorage.setItem('stocky.theme', 'light')
    setActivePinia(createPinia())
    const store = useThemeStore()
    store.bind()
    auth.state.profile = { onboarded: true, theme: 'dark' }
    await Promise.resolve()
    expect(store.theme).toBe('dark')
    expect(localStorage.getItem('stocky.theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('keeps the local value when the profile has no theme', () => {
    localStorage.setItem('stocky.theme', 'dark')
    setActivePinia(createPinia())
    const store = useThemeStore()
    store.syncFromProfile({ onboarded: true })
    expect(store.theme).toBe('dark')
  })

  it('goes back to system on logout', async () => {
    const store = useThemeStore()
    store.bind()
    await store.setTheme('dark')
    auth.state.user = null
    await Promise.resolve()
    expect(store.theme).toBe('system')
    expect(localStorage.getItem('stocky.theme')).toBeNull()
  })
})
