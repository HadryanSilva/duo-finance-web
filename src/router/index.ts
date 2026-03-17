import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ── Rotas públicas ────────────────────────────────────────────────────────
    { path: '/login',           name: 'login',           component: () => import('@/pages/LoginForm.vue') },
    { path: '/auth/callback',   name: 'auth-callback',   component: () => import('@/pages/CallbackView.vue') },
    { path: '/invite/:token',   name: 'invite',          component: () => import('@/pages/InviteView.vue') },
    { path: '/forgot-password', name: 'forgot-password', component: () => import('@/pages/ForgotPasswordView.vue') },
    { path: '/reset-password',  name: 'reset-password',  component: () => import('@/pages/ResetPasswordView.vue') },

    // ── Rotas protegidas ──────────────────────────────────────────────────────
    {
      path: '/',
      component: () => import('@/pages/AppLayout.vue'),
      children: [
        { path: '',             redirect: { name: 'dashboard' } },
        { path: 'dashboard',    name: 'dashboard',    component: () => import('@/pages/DashboardView.vue') },
        { path: 'transactions', name: 'transactions', component: () => import('@/pages/TransactionView.vue') },
        { path: 'goals',        name: 'goals',        component: () => import('@/pages/GoalsView.vue') },
        { path: 'reports',      name: 'reports',      component: () => import('@/pages/ReportsView.vue') },
        { path: 'couple',       name: 'couple',       component: () => import('@/pages/CoupleView.vue') }
      ]
    },

    // ── 404 ───────────────────────────────────────────────────────────────────
    { path: '/:pathMatch(.*)*', redirect: { name: 'login' } }
  ]
})

// ── Rotas que não precisam de autenticação ────────────────────────────────────
const PUBLIC_ROUTES = new Set([
  'login', 'auth-callback', 'invite', 'forgot-password', 'reset-password'
])

// ── Rotas que precisam de casal vinculado ─────────────────────────────────────
const REQUIRES_COUPLE = new Set(['dashboard', 'transactions', 'goals', 'reports'])

let sessionRestored = false

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!sessionRestored) {
    sessionRestored = true
    if (localStorage.getItem('access_token')) {
      await auth.restoreSession()
    }
  }

  const routeName = to.name as string | undefined

  if (routeName && PUBLIC_ROUTES.has(routeName)) {
    if (routeName === 'login' && auth.isAuthenticated) {
      const redirect = to.query.redirect as string | undefined
      if (redirect) return redirect
      return { name: auth.hasCouple ? 'dashboard' : 'couple' }
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (REQUIRES_COUPLE.has(routeName ?? '') && !auth.hasCouple) {
    return { name: 'couple' }
  }

  return true
})

export default router
