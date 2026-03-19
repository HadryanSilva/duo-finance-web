<template>
  <div class="relative" ref="dropdownRef">

    <!-- Botão do sininho -->
    <button
      @click="toggle"
      class="relative w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:bg-surface-50 hover:text-surface-700 transition-colors"
    >
      <i class="pi pi-bell text-sm" />
      <!-- Badge de não lidas -->
      <span v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div v-if="open"
        class="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-surface-200 z-50 overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-surface-100">
          <h3 class="font-display font-semibold text-surface-900 text-sm">Notificações</h3>
          <div class="flex items-center gap-2">
            <!-- Toggle ativo/inativo -->
            <button @click="toggleSettings" :title="settingsEnabled ? 'Desativar notificações' : 'Ativar notificações'"
              class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              :class="settingsEnabled ? 'text-surface-400 hover:bg-surface-100' : 'text-amber-500 hover:bg-amber-50'">
              <i :class="settingsEnabled ? 'pi pi-bell text-xs' : 'pi pi-bell-slash text-xs'" />
            </button>
            <!-- Marcar todas como lidas -->
            <button v-if="unreadCount > 0" @click="markAllAsRead"
              class="text-xs text-surface-400 hover:text-surface-700 transition-colors px-1">
              Marcar todas
            </button>
          </div>
        </div>

        <!-- Aviso quando desativado -->
        <div v-if="!settingsEnabled" class="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
          <i class="pi pi-bell-slash text-amber-500 text-xs" />
          <p class="text-xs text-amber-700">Notificações desativadas</p>
        </div>

        <!-- Lista -->
        <div class="max-h-96 overflow-y-auto scrollbar-thin">

          <div v-if="loading" class="divide-y divide-surface-50">
            <div v-for="i in 3" :key="i" class="flex gap-3 px-4 py-3">
              <div class="w-8 h-8 rounded-full bg-surface-100 animate-pulse shrink-0" />
              <div class="flex-1 space-y-1.5">
                <div class="h-3 bg-surface-100 rounded animate-pulse w-3/4" />
                <div class="h-3 bg-surface-50 rounded animate-pulse w-full" />
              </div>
            </div>
          </div>

          <div v-else-if="!notifications.length" class="py-10 text-center">
            <i class="pi pi-bell text-surface-200 text-3xl block mb-2" />
            <p class="text-surface-400 text-sm">Nenhuma notificação</p>
          </div>

          <div v-else class="divide-y divide-surface-50">
            <button
              v-for="n in notifications" :key="n.id"
              @click="handleClick(n)"
              class="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-50 transition-colors"
              :class="n.read ? 'opacity-60' : ''"
            >
              <!-- Ícone por tipo -->
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                :class="iconBg(n.type)">
                <i :class="[iconClass(n.type), 'text-xs']" />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <p class="text-xs font-semibold text-surface-800 leading-tight">{{ n.title }}</p>
                  <span class="text-[10px] text-surface-400 shrink-0 mt-0.5">{{ relativeTime(n.createdAt) }}</span>
                </div>
                <p class="text-xs text-surface-500 mt-0.5 leading-relaxed">{{ n.message }}</p>
              </div>

              <!-- Indicador de não lida -->
              <div v-if="!n.read" class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="notifications.length" class="px-4 py-2.5 border-t border-surface-100 text-center">
          <p class="text-xs text-surface-400">Últimas 30 notificações</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { notificationService } from '@/services'
import type { NotificationResponse, NotificationType } from '@/types'

// ── Estado ────────────────────────────────────────────────────────────────────

const open            = ref(false)
const loading         = ref(false)
const notifications   = ref<NotificationResponse[]>([])
const unreadCount     = ref(0)
const settingsEnabled = ref(true)
const dropdownRef     = ref<HTMLElement | null>(null)

// ── Toggle dropdown ───────────────────────────────────────────────────────────

async function toggle() {
  open.value = !open.value
  if (open.value) await loadAll()
}

async function loadAll() {
  loading.value = true
  try {
    const [list, settings] = await Promise.all([
      notificationService.list(),
      notificationService.getSettings()
    ])
    notifications.value   = list.notifications
    unreadCount.value     = list.unreadCount
    settingsEnabled.value = settings.enabled
  } finally {
    loading.value = false
  }
}

// Fechar ao clicar fora
function onClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  // Busca contagem de não lidas em background
  notificationService.list().then(r => { unreadCount.value = r.unreadCount }).catch(() => {})
})
onUnmounted(() => document.removeEventListener('click', onClickOutside))

// ── Ações ─────────────────────────────────────────────────────────────────────

async function handleClick(n: NotificationResponse) {
  if (!n.read) {
    n.read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    notificationService.markAsRead(n.id).catch(() => {})
  }
}

async function markAllAsRead() {
  notifications.value.forEach(n => n.read = true)
  unreadCount.value = 0
  await notificationService.markAllAsRead()
}

async function toggleSettings() {
  const result = await notificationService.toggleSettings()
  settingsEnabled.value = result.enabled
}

// ── Helpers visuais ───────────────────────────────────────────────────────────

function iconClass(type: NotificationType) {
  switch (type) {
    case 'GOAL_WARNING':   return 'pi pi-exclamation-triangle text-amber-600'
    case 'GOAL_EXCEEDED':  return 'pi pi-times-circle text-red-500'
    case 'BUDGET_EXCEEDED':return 'pi pi-wallet text-red-500'
    case 'PARTNER_JOINED': return 'pi pi-heart text-pink-500'
    default:               return 'pi pi-bell text-surface-500'
  }
}

function iconBg(type: NotificationType) {
  switch (type) {
    case 'GOAL_WARNING':   return 'bg-amber-50'
    case 'GOAL_EXCEEDED':  return 'bg-red-50'
    case 'BUDGET_EXCEEDED':return 'bg-red-50'
    case 'PARTNER_JOINED': return 'bg-pink-50'
    default:               return 'bg-surface-100'
  }
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  const h    = Math.floor(min / 60)
  const d    = Math.floor(h / 24)
  if (d > 0)  return `${d}d`
  if (h > 0)  return `${h}h`
  if (min > 0) return `${min}min`
  return 'agora'
}
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
