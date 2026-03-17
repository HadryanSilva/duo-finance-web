<template>
  <div class="p-4 lg:p-8 space-y-4 lg:space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-display text-surface-900 dark:text-surface-100 font-semibold text-lg">Categorias personalizadas</h2>
        <p class="text-surface-400 text-sm mt-0.5">Crie categorias específicas para o seu casal</p>
      </div>
      <Button label="Nova categoria" icon="pi pi-plus" size="small" @click="openCreate" />
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="card flex items-center gap-4 p-4">
        <div class="w-10 h-10 rounded-xl bg-surface-100 animate-pulse shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-3.5 bg-surface-100 rounded animate-pulse w-1/3" />
          <div class="h-3 bg-surface-50 rounded animate-pulse w-1/5" />
        </div>
      </div>
    </div>

    <!-- Vazio -->
    <div v-else-if="categories.length === 0" class="card py-20 text-center">
      <i class="pi pi-tag text-surface-200 text-4xl mb-3 block" />
      <p class="text-surface-700 dark:text-surface-300 font-medium mb-1">Nenhuma categoria criada</p>
      <p class="text-surface-400 text-sm mb-5">Crie categorias personalizadas para organizar melhor os lançamentos do casal.</p>
      <Button label="Criar primeira categoria" icon="pi pi-plus" size="small" @click="openCreate" />
    </div>

    <!-- Grupos: Despesas / Receitas -->
    <template v-else>
      <div v-for="group in groupedCategories" :key="group.type" class="space-y-2">
        <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wide px-1">
          {{ group.type === 'EXPENSE' ? 'Despesas' : 'Receitas' }}
        </h3>
        <div class="space-y-2">
          <div
            v-for="cat in group.items"
            :key="cat.id"
            class="card p-4 flex items-center gap-3 transition-opacity"
            :class="{ 'opacity-60': !cat.active }"
          >
            <!-- Ícone -->
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              :class="cat.type === 'EXPENSE' ? 'bg-red-50 dark:bg-red-950/40' : 'bg-green-50 dark:bg-green-950/40'"
            >
              <i
                :class="[cat.icon, 'text-sm',
                  cat.type === 'EXPENSE' ? 'text-red-400' : 'text-green-500']"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">{{ cat.name }}</p>
                <span
                  v-if="!cat.active"
                  class="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-400 shrink-0"
                >
                  Inativa
                </span>
              </div>
              <p class="text-xs text-surface-400 mt-0.5">{{ cat.icon }}</p>
            </div>

            <!-- Ações -->
            <div class="flex items-center gap-0.5 shrink-0">
              <button
                @click="openEdit(cat)"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                title="Editar"
              >
                <i class="pi pi-pencil text-xs" />
              </button>
              <button
                @click="handleToggle(cat)"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                :title="cat.active ? 'Desativar' : 'Ativar'"
              >
                <i :class="cat.active ? 'pi pi-pause text-xs' : 'pi pi-play text-xs'" />
              </button>
              <button
                @click="confirmDelete(cat)"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-colors"
                title="Excluir"
              >
                <i class="pi pi-trash text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Dialog criar / editar -->
    <Dialog
      v-model:visible="showDialog"
      :header="editingCat ? 'Editar categoria' : 'Nova categoria'"
      :modal="true"
      :style="{ width: 'min(440px, 95vw)' }"
      :pt="{ content: { class: 'p-4 lg:p-6' }, header: { class: 'px-4 lg:px-6 pt-4 lg:pt-6 pb-0' } }"
    >
      <div class="space-y-4 pt-4">

        <!-- Nome -->
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Nome</label>
          <InputText v-model="form.name" class="w-full" placeholder="Ex: Academia, Pet Shop..." maxlength="60" />
        </div>

        <!-- Tipo (só na criação) -->
        <div v-if="!editingCat">
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Tipo</label>
          <div class="flex gap-2">
            <button
              @click="form.type = 'EXPENSE'"
              class="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
              :class="form.type === 'EXPENSE'
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300'"
            >
              Despesa
            </button>
            <button
              @click="form.type = 'INCOME'"
              class="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
              :class="form.type === 'INCOME'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300'"
            >
              Receita
            </button>
          </div>
        </div>

        <!-- Ícone -->
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Ícone <span class="text-surface-400 font-normal">(PrimeIcons)</span>
          </label>
          <div class="flex gap-2">
            <InputText v-model="form.icon" class="flex-1" placeholder="pi pi-tag" />
            <div class="w-10 h-10 rounded-xl border border-surface-200 dark:border-surface-700 flex items-center justify-center shrink-0">
              <i :class="[form.icon || 'pi pi-tag', 'text-surface-500 text-sm']" />
            </div>
          </div>
          <!-- Sugestões rápidas de ícones -->
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="icon in iconSuggestions"
              :key="icon"
              @click="form.icon = icon"
              class="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors"
              :class="form.icon === icon
                ? 'border-surface-900 dark:border-surface-300 bg-surface-900 dark:bg-surface-700 text-white'
                : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-400'"
              :title="icon"
            >
              <i :class="[icon, 'text-xs']" />
            </button>
          </div>
        </div>

        <!-- Ações -->
        <div class="flex gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" class="flex-1" @click="showDialog = false" />
          <Button
            :label="editingCat ? 'Salvar' : 'Criar'"
            class="flex-1"
            :loading="submitting"
            :disabled="!form.name.trim()"
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
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { customCategoryService } from '@/services'
import type { CustomCategoryResponse, TransactionType } from '@/types'

const toast   = useToast()
const confirm = useConfirm()

// ── Dados ─────────────────────────────────────────────────────────────────────

const categories = ref<CustomCategoryResponse[]>([])
const loading    = ref(false)
const submitting = ref(false)

const groupedCategories = computed(() => {
  const groups: { type: TransactionType; items: CustomCategoryResponse[] }[] = []
  const expenses = categories.value.filter(c => c.type === 'EXPENSE')
  const incomes  = categories.value.filter(c => c.type === 'INCOME')
  if (expenses.length) groups.push({ type: 'EXPENSE', items: expenses })
  if (incomes.length)  groups.push({ type: 'INCOME',  items: incomes })
  return groups
})

onMounted(async () => {
  loading.value = true
  try {
    categories.value = await customCategoryService.listAll()
  } finally {
    loading.value = false
  }
})

// ── CRUD ──────────────────────────────────────────────────────────────────────

const showDialog  = ref(false)
const editingCat  = ref<CustomCategoryResponse | null>(null)
const form        = ref({ name: '', type: 'EXPENSE' as TransactionType, icon: 'pi pi-tag' })

function openCreate() {
  editingCat.value = null
  form.value = { name: '', type: 'EXPENSE', icon: 'pi pi-tag' }
  showDialog.value = true
}

function openEdit(cat: CustomCategoryResponse) {
  editingCat.value = cat
  form.value = { name: cat.name, type: cat.type, icon: cat.icon }
  showDialog.value = true
}

async function handleSubmit() {
  if (!form.value.name.trim()) return
  submitting.value = true
  try {
    if (editingCat.value) {
      const updated = await customCategoryService.update(editingCat.value.id, {
        name: form.value.name.trim(),
        icon: form.value.icon || 'pi pi-tag'
      })
      categories.value = categories.value.map(c => c.id === updated.id ? updated : c)
      toast.add({ severity: 'success', summary: 'Categoria atualizada', life: 3000 })
    } else {
      const created = await customCategoryService.create({
        name: form.value.name.trim(),
        type: form.value.type,
        icon: form.value.icon || 'pi pi-tag'
      })
      categories.value = [...categories.value, created]
      toast.add({ severity: 'success', summary: 'Categoria criada', life: 3000 })
    }
    showDialog.value = false
  } catch (e: unknown) {
    const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Tente novamente.'
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 4000 })
  } finally {
    submitting.value = false
  }
}

async function handleToggle(cat: CustomCategoryResponse) {
  try {
    const updated = await customCategoryService.toggle(cat.id)
    categories.value = categories.value.map(c => c.id === updated.id ? updated : c)
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao alterar categoria', life: 3000 })
  }
}

function confirmDelete(cat: CustomCategoryResponse) {
  confirm.require({
    message: `Excluir a categoria "${cat.name}"?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-trash',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Excluir',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await customCategoryService.delete(cat.id)
        categories.value = categories.value.filter(c => c.id !== cat.id)
        toast.add({ severity: 'success', summary: 'Categoria excluída', life: 3000 })
      } catch (e: unknown) {
        // Mensagem descritiva do backend (transações vinculadas)
        const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          ?? 'Não foi possível excluir. Tente novamente.'
        toast.add({ severity: 'error', summary: 'Não é possível excluir', detail, life: 6000 })
      }
    }
  })
}

// ── Sugestões de ícone ────────────────────────────────────────────────────────

const iconSuggestions = [
  'pi pi-tag',        'pi pi-star',       'pi pi-heart',
  'pi pi-car',        'pi pi-home',       'pi pi-shopping-bag',
  'pi pi-shopping-cart', 'pi pi-book',    'pi pi-briefcase',
  'pi pi-gift',       'pi pi-wrench',     'pi pi-code',
  'pi pi-plane',      'pi pi-camera',     'pi pi-music',
  'pi pi-palette',    'pi pi-desktop',    'pi pi-mobile',
]
</script>
