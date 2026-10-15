import { watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import {
  DEFAULT_THEME,
  applyTheme,
  clearStoredTheme,
  isTheme,
  readStoredTheme,
  watchSystemTheme,
  writeStoredTheme,
} from '@/utils/theme'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    // 'light' | 'dark' | 'system'. Starts from localStorage so it matches what index.html applied.
    theme: readStoredTheme(),
    // Set when saving to the profile failed. The local choice is kept regardless.
    error: '',
  }),
  actions: {
    // Applies and mirrors a theme locally (no Firestore).
    setLocal(theme) {
      if (!isTheme(theme)) return
      this.theme = theme
      writeStoredTheme(theme)
      applyTheme(theme)
    },
    // Instant locally, then saved to users/{uid}.theme. A failed save keeps the local choice.
    async setTheme(theme) {
      if (!isTheme(theme)) return
      this.error = ''
      this.setLocal(theme)
      const auth = useAuthStore()
      if (!auth.user) return
      try {
        await auth.setTheme(theme)
      } catch {
        this.error = 'Couldn’t save your theme to your account. It is applied on this device only.'
      }
    },
    // A theme stored on the profile wins over the local mirror. No theme on the profile (older
    // accounts) leaves the local value alone.
    syncFromProfile(profile) {
      if (isTheme(profile?.theme)) this.setLocal(profile.theme)
    },
    // On logout go back to following the OS. The next account to sign in then gets its own saved
    // theme from its profile, and never inherits the previous user's explicit choice.
    resetToDefault() {
      this.error = ''
      this.theme = DEFAULT_THEME
      clearStoredTheme()
      applyTheme(DEFAULT_THEME)
    },
    // Wires profile changes, logout and OS colour-scheme changes. Call once at startup.
    bind() {
      const auth = useAuthStore()
      const stops = [
        watch(
          () => auth.profile?.theme,
          () => this.syncFromProfile(auth.profile),
          { immediate: true },
        ),
        watch(
          () => auth.user?.uid ?? null,
          (uid, prev) => {
            if (prev && !uid) this.resetToDefault()
          },
        ),
        watchSystemTheme(() => {
          if (this.theme === 'system') applyTheme('system')
        }),
      ]
      return () => stops.forEach((stop) => stop())
    },
  },
})
