import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { firebaseConfigured } from './services/firebase'

const app = createApp(App).use(createPinia())

// Without Firebase config the router guard can't run, so App.vue shows a setup notice instead.
if (firebaseConfigured) app.use(router)

app.mount('#app')
