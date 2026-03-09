<template>
  <div class="flex h-screen bg-surface-50 overflow-hidden">

    <!-- Sidebar -->
    <aside
      class="flex flex-col w-64 bg-white border-r border-surface-200 shrink-0"
      style="box-shadow: 1px 0 0 0 #e4e2df"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 h-16 border-b border-surface-100">
        <div class="w-8 h-8 rounded-lg bg-surface-900 flex items-center justify-center">
          <i class="pi pi-heart text-white text-xs" />
        </div>
        <span class="font-display text-surface-900 font-semibold text-lg tracking-tight">DuoFinance</span>
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
        >
          <i
            :class="[item.icon, 'text-base transition-colors',
              isActive(item.to) ? 'text-white' : 'text-surface-400 group-hover:text-surface-600'
            ]"
          />
          {{ item.label }}

          <!-- Badge casal pendente -->
          <span
            v-if="item.to === '/couple' && coupleStore.couple?.waitingForPartner"
            class="ml-auto w-2 h-2 rounded-full bg-amber-400"
          />
        </RouterLink>
      </nav>

      <!-- Casal info -->
      <div
        v-if="coupleStore.couple"
        class="mx-3 mb-3 px-3 py-3 rounded-xl bg-surface-50 border border-surface-100"
      >
        <div class="flex items-center gap-2 mb-1">
          <i class="pi pi-users text-surface-400 text-xs" />
          <span class="text-xs text-surface-500 font-medium">{{ coupleStore.couple.name }}</span>
        </div>
        <div class="flex -space-x-1">
          <template v-for="member in coupleStore.couple.members" :key="member.id">
            <img
              v-if="member.avatarUrl"
              :src="member.avatarUrl"
              :alt="member.firstName"
              class="w-6 h-6 rounded-full border-2 border-white object-cover"
            />
            <div
              v-else
              class="w-6 h-6 rounded-full border-2 border-white bg-surface-200 flex items-center justify-center"
            >
              <span class="text-surface-600 text-xs font-medium">{{ member.firstName[0] }}</span>
            </div>
          </template>
          <div
            v-if="coupleStore.couple.waitingForPartner"
            class="w-6 h-6 rounded-full border-2 border-white border-dashed border-surface-300 bg-surface-50 flex items-center justify-center"
          >
            <i class="pi pi-plus text-surface-400" style="font-size: 8px" />
          </div>
        </div>
      </div>

      <!-- Usuário -->
      <div class="px-3 pb-4">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-all duration-150 group"
        >
          <img
            v-if="auth.user?.avatarUrl"
            :src="auth.user.avatarUrl"
            :alt="auth.fullName"
            class="w-7 h-7 rounded-full object-cover"
          />
          <div v-else class="w-7 h-7 rounded-full bg-surface-200 flex items-center justify-center">
            <span class="text-surface-600 text-xs font-medium">{{ auth.user?.firstName?.[0] }}</span>
          </div>
          <div class="flex-1 text-left min-w-0">
            <p class="font-medium text-surface-800 text-xs truncate">{{ auth.fullName }}</p>
            <p class="text-surface-400 text-xs truncate">{{ auth.user?.email }}</p>
          </div>
          <i class="pi pi-sign-out text-surface-400 group-hover:text-surface-600 text-xs shrink-0" />
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- Topbar -->
      <header class="flex items-center justify-between px-8 h-16 bg-white border-b border-surface-100 shrink-0">
        <div>
          <h1 class="font-display text-lg font-semibold text-surface-900 leading-tight">
            {{ currentTitle }}
          </h1>
          <p class="text-surface-400 text-xs">{{ currentDate }}</p>
        </div>

        <div class="flex items-center gap-2">
          <button class="w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:bg-surface-50 hover:text-surface-700 transition-colors">
            <i class="pi pi-bell text-sm" />
          </button>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto scrollbar-thin">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCoupleStore } from '@/stores/couple'

const auth = useAuthStore()
const coupleStore = useCoupleStore()
const route = useRoute()
const router = useRouter()

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',     icon: 'pi pi-chart-line' },
  { to: '/transactions', label: 'Transações',     icon: 'pi pi-list' },
  { to: '/couple',       label: 'Nosso casal',    icon: 'pi pi-users' }
]

const routeTitles: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/transactions': 'Transações',
  '/couple':       'Nosso casal'
}

const currentTitle = computed(() => routeTitles[route.path] ?? 'DuoFinance')

const currentDate = computed(() =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

function isActive(path: string) {
  return route.path.startsWith(path)
}

async function handleLogout() {
  await auth.logout()
  coupleStore.clear()
  router.push('/login')
}

onMounted(async () => {
  if (auth.hasCouple && !coupleStore.couple) {
    await coupleStore.fetchCouple()
  }
})
</script>