import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('@/views/SetupView.vue'),
      meta: { setup: true },
    },
    {
      path: '/',
      name: 'diary',
      component: () => import('@/views/DiaryView.vue'),
      meta: { tabs: true },
    },
    {
      path: '/add',
      name: 'add',
      component: () => import('@/views/AddFoodView.vue'),
    },
    {
      path: '/foods',
      name: 'foods',
      component: () => import('@/views/FoodsView.vue'),
      meta: { tabs: true },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
      meta: { tabs: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { tabs: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  if (!auth.isSignedIn) return to.meta.public ? true : { name: 'login' }
  if (to.meta.public) return { name: 'diary' }
  if (auth.needsSetup && !to.meta.setup) return { name: 'setup' }
  return true
})

export default router
