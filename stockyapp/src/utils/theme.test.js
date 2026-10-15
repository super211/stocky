import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  STORAGE_KEY,
  THEME_COLORS,
  applyTheme,
  clearStoredTheme,
  normalizeTheme,
  readStoredTheme,
  resolveTheme,
  systemPrefersDark,
  watchSystemTheme,
  writeStoredTheme,
} from './theme'

const throwing = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
  removeItem: () => {
    throw new Error('blocked')
  },
}

const memory = () => {
  const data = {}
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => (data[k] = String(v)),
    removeItem: (k) => delete data[k],
  }
}

afterEach(() => {
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
  document.head.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove())
})

describe('resolveTheme', () => {
  it('follows the OS only for system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
  it('treats invalid values as system', () => {
    expect(normalizeTheme('purple')).toBe('system')
    expect(resolveTheme(undefined, true)).toBe('dark')
  })
})

describe('stored theme', () => {
  it('round-trips a valid value', () => {
    const s = memory()
    expect(writeStoredTheme('dark', s)).toBe(true)
    expect(s.data[STORAGE_KEY]).toBe('dark')
    expect(readStoredTheme(s)).toBe('dark')
    clearStoredTheme(s)
    expect(readStoredTheme(s)).toBe('system')
  })
  it('falls back to system for invalid stored values', () => {
    const s = memory()
    s.setItem(STORAGE_KEY, 'neon')
    expect(readStoredTheme(s)).toBe('system')
  })
  it('does not throw when storage throws', () => {
    expect(readStoredTheme(throwing)).toBe('system')
    expect(writeStoredTheme('dark', throwing)).toBe(false)
    expect(() => clearStoredTheme(throwing)).not.toThrow()
    expect(writeStoredTheme('dark', null)).toBe(false)
  })
})

describe('applyTheme', () => {
  const win = (dark) => ({ matchMedia: () => ({ matches: dark }) })

  it('adds and removes the dark class and sets color-scheme and theme-color', () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.append(meta)
    expect(applyTheme('dark', document, win(false))).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(meta.getAttribute('content')).toBe(THEME_COLORS.dark)
    expect(applyTheme('light', document, win(true))).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(meta.getAttribute('content')).toBe(THEME_COLORS.light)
  })
  it('resolves system from the OS', () => {
    expect(applyTheme('system', document, win(true))).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(applyTheme('system', document, win(false))).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('system preference', () => {
  it('is false without matchMedia', () => {
    expect(systemPrefersDark({})).toBe(false)
  })
  it('subscribes and unsubscribes to changes', () => {
    const mq = { addEventListener: vi.fn(), removeEventListener: vi.fn() }
    const cb = vi.fn()
    const stop = watchSystemTheme(cb, { matchMedia: () => mq })
    expect(mq.addEventListener).toHaveBeenCalledWith('change', cb)
    stop()
    expect(mq.removeEventListener).toHaveBeenCalledWith('change', cb)
  })
  it('returns a no-op without matchMedia', () => {
    expect(() => watchSystemTheme(() => {}, {})()).not.toThrow()
  })
})
