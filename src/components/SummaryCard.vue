<template>
  <div class="card relative overflow-hidden">
    <!-- Fundo decorativo sutil -->
    <div
      class="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-[0.06]"
      :class="bgAccent"
    />

    <div class="flex items-start justify-between mb-4">
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center"
        :class="iconBg"
      >
        <i :class="['pi', icon, 'text-sm', iconColor]" />
      </div>
      <span class="text-xs font-medium text-surface-400 uppercase tracking-wider">{{ label }}</span>
    </div>

    <div v-if="loading" class="h-8 w-32 bg-surface-100 rounded-lg animate-pulse" />
    <template v-else>
      <p
        class="font-display text-2xl font-bold tracking-tight"
        :class="valueColor"
      >
        {{ formatted }}
      </p>
      <p v-if="highlight && summary" class="text-xs text-surface-400 mt-1">
        {{ summary }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: number
  icon: string
  color: 'income' | 'expense' | 'neutral'
  loading?: boolean
  highlight?: boolean
}>()

const formatted = computed(() =>
  props.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
)

const summary = computed(() => {
  if (props.color !== 'neutral') return null
  return props.value >= 0 ? 'Saldo positivo' : 'Saldo negativo'
})

const bgAccent = computed(() => ({
  income:  'bg-green-500',
  expense: 'bg-red-500',
  neutral: 'bg-surface-900'
}[props.color]))

const iconBg = computed(() => ({
  income:  'bg-green-50',
  expense: 'bg-red-50',
  neutral: 'bg-surface-50'
}[props.color]))

const iconColor = computed(() => ({
  income:  'text-green-600',
  expense: 'text-red-500',
  neutral: 'text-surface-600'
}[props.color]))

const valueColor = computed(() => {
  if (props.color === 'income')  return 'text-green-600'
  if (props.color === 'expense') return 'text-red-500'
  return props.value >= 0 ? 'text-surface-900' : 'text-red-500'
})
</script>
