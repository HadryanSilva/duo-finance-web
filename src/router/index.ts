import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginForm.vue')
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/pages/CallbackView.vue')
    },
    {
      path: '/invite/:token',
      name: 'invite',
      component: () => import('@/pages/CoupleView.vue')
    },
    {
      path: '/',
      component: () => import('@/pages/AppLayout.vue'),
      children: [
        { path: '', redirect: { name: 'dashboard' } },
        { path: 'dashboard',    name: 'dashboard',    component: () => import('@/pages/DashboardView.vue') },
        { path: 'transactions', name: 'transactions', component: () => import('@/pages/TransactionView.vue') },
        { path: 'couple',       name: 'couple',       component: () => import('@/pages/CoupleView.vue') }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'login' } }
  ]
})

const PUBLIC_ROUTES  = new Set(['login', 'auth-callback', 'invite'])
const REQUIRES_COUPLE = new Set(['dashboard', 'transactions'])

let sessionRestored = false

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const routeName = to.name as string | undefined

  console.log('[GUARD]', {
    to: to.fullPath,
    name: routeName,
    isAuthenticated: auth.isAuthenticated,
    hasCouple: auth.hasCouple,
    hasToken: !!localStorage.getItem('access_token'),
    sessionRestored
  })

  if (!sessionRestored) {
    sessionRestored = true
    if (localStorage.getItem('access_token')) {
      console.log('[GUARD] restoring session...')
      await auth.restoreSession()
      console.log('[GUARD] session restored:', { isAuthenticated: auth.isAuthenticated, hasCouple: auth.hasCouple })
    }
  }

  if (routeName && PUBLIC_ROUTES.has(routeName)) {
    if (routeName === 'login' && auth.isAuthenticated) {
      const dest = auth.hasCouple ? 'dashboard' : 'couple'
      console.log('[GUARD] authenticated on login → redirect to', dest)
      return { name: dest }
    }
    console.log('[GUARD] public route → allow')
    return true
  }

  if (!auth.isAuthenticated) {
    console.log('[GUARD] not authenticated → login')
    return { name: 'login' }
  }

  if (REQUIRES_COUPLE.has(routeName ?? '') && !auth.hasCouple) {
    console.log('[GUARD] no couple → couple')
    return { name: 'couple' }
  }

  console.log('[GUARD] allow')
  return true
})

export default router