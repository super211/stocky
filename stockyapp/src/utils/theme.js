// Theme helpers: a stored choice ('light' | 'dark' | 'system') resolved to light or dark and
// applied to <html>. Functions take their environment as arguments so they are testable.

export const THEMES = ['light', 'dark', 'system']
export const DEFAULT_THEME = 'system'
export const STORAGE_KEY = 'stocky.theme'

// Keep in sync with the inline script in index.html and the tokens in assets/main.css.
export const THEME_COLORS = { light: '#16a34a', dark: '#0f172a' }

export const isTheme = (value) => THEMES.includes(value)
export const normalizeTheme = (value) => (isTheme(value) ? value : DEFAULT_THEME)

export function systemPrefersDark(win = globalThis.window) {
  try {
    return Boolean(win?.matchMedia?.('(prefers-color-scheme: dark)')?.matches)
  } catch {
    return false
  }
}

// 'system' follows the OS; explicit choices win.
export function resolveTheme(theme, prefersDark) {
  const t = normalizeTheme(theme)
  if (t === 'system') return prefersDark ? 'dark' : 'light'
  return t
}

function defaultStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

// Storage can throw (private mode, blocked cookies); a failure just means "no stored theme".
export function readStoredTheme(storage = defaultStorage()) {
  try {
    return normalizeTheme(storage?.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_THEME
  }
}

// Returns false if the value could not be stored.
export function writeStoredTheme(theme, storage = defaultStorage()) {
  try {
    if (!storage) return false
    storage.setItem(STORAGE_KEY, normalizeTheme(theme))
    return true
  } catch {
    return false
  }
}

export function clearStoredTheme(storage = defaultStorage()) {
  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    // ignore: nothing to clear
  }
}

// Toggles the `dark` class, color-scheme and <meta name="theme-color">. Returns 'light' | 'dark'.
export function applyTheme(theme, doc = globalThis.document, win = globalThis.window) {
  const resolved = resolveTheme(theme, systemPrefersDark(win))
  const root = doc?.documentElement
  if (!root) return resolved
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved])
  return resolved
}

// Calls `onChange` when the OS colour scheme changes. Returns an unsubscribe function.
export function watchSystemTheme(onChange, win = globalThis.window) {
  let mq
  try {
    mq = win?.matchMedia?.('(prefers-color-scheme: dark)')
  } catch {
    mq = null
  }
  if (!mq) return () => {}
  if (mq.addEventListener) {
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }
  mq.addListener?.(onChange)
  return () => mq.removeListener?.(onChange)
}
