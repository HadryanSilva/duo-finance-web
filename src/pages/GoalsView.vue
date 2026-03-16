<template>
  <div class="p-4 lg:p-8 space-y-4 lg:space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-display text-surface-900 font-semibold text-lg">Metas financeiras</h2>
        <p class="text-surface-400 text-sm mt-0.5">Defina limites mensais por categoria de despesa</p>
      </div>
      <Button
        label="Nova meta"
        icon="pi pi-plus"
        size="small"
        @click="openCreate"
      />
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="card flex items-center gap-4 p-4">
        <div class="w-10 h-10 rounded-xl bg-surface-100 animate-pulse shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-3.5 bg-surface-100 rounded animate-pulse w-1/3" />
          <div class="h-2.5 bg-surface-50 rounded-full animate-pulse w-full" />
        </div>
        <div class="h-4 bg-surface-100 rounded animate-pulse w-16" />
      </div>
    </div>

    <!-- Vazio -->
    <div v-else-if="goalStore.goals.length === 0" class="card py-20 text-center">
      <i class="pi pi-flag text-surface-200 text-4xl mb-3 block" />
      <p class="text-surface-700 font-medium mb-1">Nenhuma meta definida</p>
      <p class="text-surface-400 text-sm mb-5">Crie metas mensais para controlar seus gastos por categoria.</p>
      <Button label="Criar primeira meta" icon="pi pi-plus" size="small" @click="openCreate" />
    </div>

    <!-- Lista de metas -->
    <div v-else class="space-y-3">
      <div
        v-for="goal in goalStore.goals"
        :key="goal.id"
        class="card p-4 lg:p-5 transition-opacity"
        :class="{ 'opacity-60': !goal.active }"
      >
        <div class="flex items-start gap-3 lg:gap-4">
          <!-- Ícone categoria -->
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-surface-100">
            <i :class="[categoryIcon(goal.category), 'text-sm text-surface-600']" />
          </div>

          <!-- Info + barra -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <p class="text-sm font-medium text-surface-800 truncate">{{ goal.categoryLabel }}</p>
                <span
                  v-if="!goal.active"
                  class="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-surface-100 text-surface-400 shrink-0"
                >
                  Pausada
                </span>
              </div>
              <p class="text-sm font-mono font-medium text-surface-700 shrink-0 ml-2">
                {{ formatCurrency(goal.monthlyLimit) }}
              </p>
            </div>

            <!-- Barra de progresso -->
            <template v-if="progressMap[goal.id]">
              <div class="w-full bg-surface-100 rounded-full h-2 overflow-hidden mb-1.5">
                <div
                  class="h-2 rounded-full transition-all duration-500"
                  :class="progressBarColor(progressMap[goal.id]!.alertLevel)"
                  :style="{ width: `${progressMap[goal.id]!.percentage}%` }"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-surface-400">
                  {{ formatCurrency(progressMap[goal.id]!.spent) }} gastos este mês
                </span>
                <span
                  class="text-xs font-medium"
                  :class="progressTextColor(progressMap[goal.id]!.alertLevel)"
                >
                  {{ progressMap[goal.id]!.percentage.toFixed(0) }}%
                  <span v-if="progressMap[goal.id]!.alertLevel === 'EXCEEDED'">🚨</span>
                  <span v-else-if="progressMap[goal.id]!.alertLevel === 'WARNING'">⚠️</span>
                </span>
              </div>
            </template>
            <div v-else class="w-full bg-surface-100 rounded-full h-2" />
          </div>

          <!-- Ações -->
          <div class="flex items-center gap-0.5 shrink-0">
            <button
              @click="openEdit(goal)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
              title="Editar limite"
            >
              <i class="pi pi-pencil text-xs" />
            </button>
            <button
              @click="handleToggle(goal)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
              :title="goal.active ? 'Pausar meta' : 'Ativar meta'"
            >
              <i :class="goal.active ? 'pi pi-pause text-xs' : 'pi pi-play text-xs'" />
            </button>
            <button
              @click="confirmDelete(goal)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Remover meta"
            >
              <i class="pi pi-trash text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog criar / editar -->
    <Dialog
      v-model:visible="showDialog"
      :header="editingGoal ? 'Editar meta' : 'Nova meta'"
      :modal="true"
      :style="{ width: 'min(440px, 95vw)' }"
      :pt="{ content: { class: 'p-4 lg:p-6' }, header: { class: 'px-4 lg:px-6 pt-4 lg:pt-6 pb-0' } }"
    >
      <div class="space-y-4 pt-4">

        <!-- Categoria (só na criação) -->
        <div v-if="!editingGoal">
          <label class="block text-sm font-medium text-surface-700 mb-2">Categoria</label>
          <Select
            v-model="form.category"
            :options="availableCategories"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecione uma categoria de despesa"
            class="w-full"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <i :class="[categoryIcon(option.value), 'text-sm text-surface-500']" />
                {{ option.label }}
              </div>
            </template>
          </Select>
        </div>

        <!-- Categoria leitura apenas (edição) -->
        <div v-else>
          <label class="block text-sm font-medium text-surface-700 mb-2">Categoria</label>
          <div class="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-surface-200 bg-surface-50">
            <i :class="[categoryIcon(editingGoal.category), 'text-sm text-surface-500']" />
            <span class="text-sm text-surface-700">{{ editingGoal.categoryLabel }}</span>
          </div>
        </div>

        <!-- Limite mensal -->
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-2">Limite mensal</label>
          <InputNumber
            v-model="form.monthlyLimit"
            mode="currency"
            currency="BRL"
            locale="pt-BR"
            class="w-full"
            placeholder="R$ 0,00"
            :minFractionDigits="2"
          />
        </div>

        <!-- Ações -->
        <div class="flex gap-2 pt-2">
          <Button
            label="Cancelar"
            severity="secondary"
            class="flex-1"
            @click="showDialog = false"
          />
          <Button
            :label="editingGoal ? 'Salvar' : 'Criar meta'"
            class="flex-1"
            :loading="goalStore.submitting"
            :disabled="!isFormValid"
            @click="handleSubmit"
          />
        </div>
      </div>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useGoalStore } from '@/stores/goal'
import { categoryService } from '@/services'
import type { GoalResponse, GoalProgressResponse, TransactionCategory, CategoryResponse, AlertLevel } from '@/types'
import { categoryIcon } from '@/utils/categoryIcon'

const confirm   = useConfirm()
const toast     = useToast()
const goalStore = useGoalStore()

// ── Dados ─────────────────────────────────────────────────────────────────────

const loading       = ref(false)
const allCategories = ref<CategoryResponse[]>([])

const progressMap = computed(() => {
  const map: Record<string, GoalProgressResponse> = {}
  for (const p of goalStore.progress) map[p.id] = p
  return map
})

// Categorias de despesa ainda sem meta criada
const availableCategories = computed(() => {
  const used = new Set(goalStore.goals.map(g => g.category))
  return allCategories.value
    .filter(c => c.type === 'EXPENSE' && !used.has(c.name))
    .map(c => ({ label: c.label, value: c.name }))
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      goalStore.fetchGoals(),
      goalStore.fetchProgress(),
      categoryService.list('EXPENSE').then(d => allCategories.value = d)
    ])
  } finally {
    loading.value = false
  }
})

// ── CRUD ──────────────────────────────────────────────────────────────────────

const showDialog  = ref(false)
const editingGoal = ref<GoalResponse | null>(null)
const form        = ref({ category: '' as TransactionCategory | '', monthlyLimit: null as number | null })

const isFormValid = computed(() =>
  form.value.monthlyLimit !== null &&
  form.value.monthlyLimit > 0 &&
  (editingGoal.value !== null || !!form.value.category)
)

function openCreate() {
  editingGoal.value      = null
  form.value.category    = ''
  form.value.monthlyLimit = null
  showDialog.value       = true
}

function openEdit(goal: GoalResponse) {
  editingGoal.value       = goal
  form.value.category     = goal.category
  form.value.monthlyLimit = goal.monthlyLimit
  showDialog.value        = true
}

async function handleSubmit() {
  if (!isFormValid.value) return
  try {
    if (editingGoal.value) {
      await goalStore.update(editingGoal.value.id, { monthlyLimit: form.value.monthlyLimit! })
      toast.add({ severity: 'success', summary: 'Meta atualizada', life: 3000 })
    } else {
      await goalStore.create({
        category: form.value.category as TransactionCategory,
        monthlyLimit: form.value.monthlyLimit!
      })
      toast.add({ severity: 'success', summary: 'Meta criada', life: 3000 })
    }
    showDialog.value = false
    await goalStore.fetchProgress()
  } catch {
    // erro já tratado no store
  }
}

async function handleToggle(goal: GoalResponse) {
  try {
    await goalStore.toggle(goal.id)
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao alterar meta', life: 3000 })
  }
}

function confirmDelete(goal: GoalResponse) {
  confirm.require({
    message: `Remover meta de "${goal.categoryLabel}"?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-trash',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Remover',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await goalStore.remove(goal.id)
        toast.add({ severity: 'success', summary: 'Meta removida', life: 3000 })
      } catch {
        toast.add({ severity: 'error', summary: 'Erro ao remover meta', life: 3000 })
      }
    }
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function progressBarColor(level: AlertLevel) {
  if (level === 'EXCEEDED') return 'bg-red-500'
  if (level === 'WARNING')  return 'bg-amber-400'
  return 'bg-green-500'
}

function progressTextColor(level: AlertLevel) {
  if (level === 'EXCEEDED') return 'text-red-500'
  if (level === 'WARNING')  return 'text-amber-500'
  return 'text-surface-500'
}
</script>
