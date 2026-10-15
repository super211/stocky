import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { firebaseConfigured } from './services/firebase'
import { useThemeStore } from './stores/theme'
import { applyTheme, readStoredTheme } from './utils/theme'

// Apply the stored theme before mounting so there is no flash of the wrong theme.
applyTheme(readStoredTheme())

const pinia = createPinia()
const app = createApp(App).use(pinia)
useThemeStore(pinia).bind()

// Without Firebase config the router guard can't run, so App.vue shows a setup notice instead.
if (firebaseConfigured) app.use(router)

app.mount('#app')
