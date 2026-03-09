import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ── Auth ──────────────────────────────────────────────────────────────────
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginForm.vue'),
      meta: { public: true }
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/pages/CallbackView.vue'),
      meta: { public: true }
    },

    // ── App (requer autenticação) ─────────────────────────────────────────────
    {
      path: '/',
      component: () => import('@/pages/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/pages/DashboardView.vue'),
          meta: { requiresCouple: true }
        },
        {
          path: 'transactions',
          name: 'transactions',
          component: () => import('@/pages/TransactionView.vue'),
          meta: { requiresCouple: true }
        },
        {
          path: 'couple',
          name: 'couple',
          component: () => import('@/pages/CoupleView.vue')
        }
      ]
    },

    // ── Invite público ────────────────────────────────────────────────────────
    {
      path: '/invite/:token',
      name: 'invite',
      component: () => import('@/pages/CoupleView.vue'),
      meta: { public: true }
    },

    // ── 404 ───────────────────────────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// ── Guard global ──────────────────────────────────────────────────────────────
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.isAuthenticated && localStorage.getItem('access_token')) {
    await auth.restoreSession()
  }

  if (to.meta.public) return true

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.requiresCouple && !auth.hasCouple) {
    return { name: 'couple' }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
