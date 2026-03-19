<template>
  <div class="flex h-screen bg-surface-50 overflow-hidden">

    <Transition name="overlay">
      <div v-if="sidebarOpen" class="fixed inset-0 bg-black/40 z-30 lg:hidden" @click="sidebarOpen = false" />
    </Transition>

    <Transition name="sidebar">
      <aside
        v-show="sidebarOpen || isDesktop"
        class="fixed lg:relative inset-y-0 left-0 z-40 flex flex-col w-64 bg-white border-r border-surface-200 shrink-0 lg:translate-x-0"
        style="box-shadow: 1px 0 0 0 #e4e2df"
      >
        <!-- Logo -->
        <div class="flex items-center justify-between px-6 h-16 border-b border-surface-100">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-surface-900 flex items-center justify-center">
              <i class="pi pi-heart text-white text-xs" />
            </div>
            <span class="font-display text-surface-900 font-semibold text-lg tracking-tight">DuoFinance</span>
          </div>
          <button class="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-50" @click="sidebarOpen = false">
            <i class="pi pi-times text-sm" />
          </button>
        </div>

        <!-- Nav -->
        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
            :class="isActive(item.to)
              ? 'bg-surface-900 text-white'
              : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'"
            @click="sidebarOpen = false"
          >
            <i :class="[item.icon, 'text-base transition-colors',
              isActive(item.to) ? 'text-white' : 'text-surface-400 group-hover:text-surface-600']" />
            {{ item.label }}
            <span v-if="item.to === '/couple' && coupleStore.couple?.waitingForPartner"
              class="ml-auto w-2 h-2 rounded-full bg-amber-400" />
          </RouterLink>
        </nav>

        <!-- Casal info -->
        <div v-if="coupleStore.couple" class="mx-3 mb-3 px-3 py-3 rounded-xl bg-surface-50 border border-surface-100">
          <div class="flex items-center gap-2 mb-1">
            <i class="pi pi-users text-surface-400 text-xs" />
            <span class="text-xs text-surface-500 font-medium">{{ coupleStore.couple.name }}</span>
          </div>
          <div class="flex -space-x-1">
            <template v-for="member in coupleStore.couple.members" :key="member.id">
              <img v-if="member.avatarUrl" :src="member.avatarUrl" :alt="member.firstName" class="w-6 h-6 rounded-full border-2 border-white object-cover" />
              <div v-else class="w-6 h-6 rounded-full border-2 border-white bg-surface-200 flex items-center justify-center">
                <span class="text-surface-600 text-xs font-medium">{{ member.firstName[0] }}</span>
              </div>
            </template>
            <div v-if="coupleStore.couple.waitingForPartner"
              class="w-6 h-6 rounded-full border-2 border-white border-dashed border-surface-300 bg-surface-50 flex items-center justify-center">
              <i class="pi pi-plus text-surface-400" style="font-size: 8px" />
            </div>
          </div>
        </div>

        <!-- Usuário -->
        <div class="px-3 pb-4">
          <div class="flex items-center gap-2 px-3 py-2.5 rounded-xl">
            <button @click="showProfile = true" class="relative shrink-0 group" title="Editar perfil">
              <img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" :alt="auth.fullName"
                class="w-7 h-7 rounded-full object-cover ring-2 ring-transparent group-hover:ring-surface-300 transition-all" />
              <div v-else class="w-7 h-7 rounded-full bg-surface-200 flex items-center justify-center ring-2 ring-transparent group-hover:ring-surface-300 transition-all">
                <span class="text-surface-600 text-xs font-medium">{{ auth.user?.firstName?.[0] }}</span>
              </div>
              <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white border border-surface-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="pi pi-pencil text-surface-500" style="font-size: 7px" />
              </span>
            </button>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-surface-800 text-xs truncate">{{ auth.fullName }}</p>
              <p class="text-surface-400 text-xs truncate">{{ auth.user?.email }}</p>
            </div>
            <button @click="handleLogout"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors shrink-0"
              title="Sair">
              <i class="pi pi-sign-out text-xs" />
            </button>
          </div>
        </div>
      </aside>
    </Transition>

    <ProfileModal v-model="showProfile" />

    <!-- MAIN -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- Topbar -->
      <header class="flex items-center justify-between px-4 lg:px-8 h-16 bg-white border-b border-surface-100 shrink-0">
        <div class="flex items-center gap-3">
          <button class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-surface-500 hover:bg-surface-50 transition-colors" @click="sidebarOpen = true">
            <i class="pi pi-bars text-sm" />
          </button>
          <div>
            <h1 class="font-display text-base lg:text-lg font-semibold text-surface-900 leading-tight">{{ currentTitle }}</h1>
            <p class="text-surface-400 text-xs hidden sm:block">{{ currentDate }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Substituir o botão estático pelo componente: -->
          <NotificationDropdown />
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto scrollbar-thin pb-16 lg:pb-0">
        <RouterView />
      </main>
    </div>

    <!-- BOTTOM NAV (mobile) -->
    <nav class="fixed bottom-0 inset-x-0 z-20 lg:hidden bg-white border-t border-surface-200 flex items-center safe-bottom">
      <RouterLink
        v-for="item in mobileNavItems"
        :key="item.to"
        :to="item.to"
        class="relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors"
        :class="isActive(item.to) ? 'text-surface-900' : 'text-surface-400'"
      >
        <i :class="[item.icon, 'text-lg']" />
        <span class="text-[10px]">{{ item.label }}</span>
        <span v-if="item.to === '/couple' && coupleStore.couple?.waitingForPartner"
          class="absolute top-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
      </RouterLink>
    </nav>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'
import ProfileModal from './ProfileModal.vue'
import NotificationDropdown from '../components/NotificationDropdown.vue'

const auth        = useAuthStore()
const coupleStore = useCoupleStore()
const route       = useRoute()
const router      = useRouter()

const showProfile = ref(false)
const sidebarOpen = ref(false)
const isDesktop   = ref(false)

function checkBreakpoint() {
  isDesktop.value = window.innerWidth >= 1024
  if (isDesktop.value) sidebarOpen.value = false
}

onMounted(() => { checkBreakpoint(); window.addEventListener('resize', checkBreakpoint) })
onUnmounted(() => { window.removeEventListener('resize', checkBreakpoint) })

// Nav completo para sidebar desktop
const navItems = [
  { to: '/dashboard',    label: 'Dashboard',  icon: 'pi pi-chart-line' },
  { to: '/transactions', label: 'Transações', icon: 'pi pi-list'       },
  { to: '/goals',        label: 'Metas',      icon: 'pi pi-flag'       },
  { to: '/budget',       label: 'Orçamento',  icon: 'pi pi-wallet'     },
  { to: '/reports',      label: 'Relatórios', icon: 'pi pi-chart-bar'  },
  { to: '/categories',   label: 'Categorias', icon: 'pi pi-tag'        },
  { to: '/couple',       label: 'Casal',      icon: 'pi pi-users'      }
]

// Bottom nav mobile: só os 5 mais usados (sem Categorias e Relatórios)
const mobileNavItems = [
  { to: '/dashboard',    label: 'Dashboard',  icon: 'pi pi-chart-line' },
  { to: '/transactions', label: 'Transações', icon: 'pi pi-list'       },
  { to: '/goals',        label: 'Metas',      icon: 'pi pi-flag'       },
  { to: '/budget',       label: 'Orçamento',  icon: 'pi pi-wallet'     },
  { to: '/couple',       label: 'Casal',      icon: 'pi pi-users'      }
]

const routeTitles: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/transactions': 'Transações',
  '/goals':        'Metas',
  '/budget':       'Orçamento',
  '/reports':      'Relatórios',
  '/categories':   'Categorias',
  '/couple':       'Nosso casal'
}

const currentTitle = computed(() => routeTitles[route.path] ?? 'DuoFinance')
const currentDate  = computed(() =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

function isActive(path: string) { return route.path.startsWith(path) }

async function handleLogout() {
  await auth.logout()
  coupleStore.clear()
  router.push('/login')
}

onMounted(async () => {
  if (auth.hasCouple && !coupleStore.couple) await coupleStore.fetchCouple()
})
</script>

<style scoped>
.sidebar-enter-active, .sidebar-leave-active { transition: transform 0.25s ease; }
.sidebar-enter-from, .sidebar-leave-to { transform: translateX(-100%); }
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
</style>
