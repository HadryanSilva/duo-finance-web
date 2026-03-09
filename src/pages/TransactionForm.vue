<template>
  <form class="space-y-4" @submit.prevent="submit">

    <!-- Categoria -->
    <div>
      <label class="block text-sm font-medium text-surface-700 mb-2">Categoria</label>
      <Select
        v-model="form.category"
        :options="categories"
        optionLabel="label"
        optionValue="name"
        placeholder="Selecione uma categoria"
        class="w-full"
        :filter="true"
        filterPlaceholder="Buscar..."
      >
        <template #option="{ option }">
          <div class="flex items-center gap-2">
            <span
              class="text-xs font-medium px-1.5 py-0.5 rounded"
              :class="option.type === 'INCOME' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'"
            >
              {{ option.type === 'INCOME' ? '+' : '−' }}
            </span>
            {{ option.label }}
          </div>
        </template>
      </Select>
    </div>

    <!-- Valor -->
    <div>
      <label class="block text-sm font-medium text-surface-700 mb-2">Valor</label>
      <InputNumber
        v-model="form.amount"
        mode="currency"
        currency="BRL"
        locale="pt-BR"
        class="w-full"
        placeholder="R$ 0,00"
        :minFractionDigits="2"
      />
    </div>

    <!-- Data -->
    <div>
      <label class="block text-sm font-medium text-surface-700 mb-2">Data</label>
      <DatePicker
        v-model="form.dateObj"
        dateFormat="dd/mm/yy"
        class="w-full"
        :showIcon="true"
      />
    </div>

    <!-- Descrição -->
    <div>
      <label class="block text-sm font-medium text-surface-700 mb-2">
        Descrição <span class="text-surface-400 font-normal">(opcional)</span>
      </label>
      <InputText
        v-model="form.description"
        placeholder="Ex: Supermercado Extra"
        class="w-full"
        maxlength="200"
      />
    </div>

    <!-- Recorrência -->
    <div class="flex items-center justify-between p-4 rounded-xl bg-surface-50 border border-surface-100">
      <div>
        <p class="text-sm font-medium text-surface-800">Transação recorrente</p>
        <p class="text-xs text-surface-400 mt-0.5">Repetir automaticamente</p>
      </div>
      <ToggleSwitch v-model="form.recurring" />
    </div>

    <!-- Configuração recorrência -->
    <template v-if="form.recurring">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-surface-600 mb-2">Frequência</label>
          <Select
            v-model="form.recurrenceRule"
            :options="recurrenceOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-surface-600 mb-2">Até (opcional)</label>
          <DatePicker
            v-model="form.recurrenceEndDateObj"
            dateFormat="dd/mm/yy"
            class="w-full"
            :showIcon="true"
          />
        </div>
      </div>
    </template>

    <!-- Ações -->
    <div class="flex gap-2 pt-2">
      <Button
        type="button"
        label="Cancelar"
        severity="secondary"
        class="flex-1"
        @click="$emit('cancel')"
      />
      <Button
        type="submit"
        :label="transaction ? 'Salvar alterações' : 'Adicionar'"
        class="flex-1"
        :loading="loading"
        :disabled="!isValid"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import type { TransactionResponse, CategoryResponse } from '@/types'

const props = defineProps<{
  transaction?: TransactionResponse
  categories: CategoryResponse[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: any]
  cancel: []
}>()

const recurrenceOptions = [
  { label: 'Diário',  value: 'DAILY' },
  { label: 'Semanal', value: 'WEEKLY' },
  { label: 'Mensal',  value: 'MONTHLY' },
  { label: 'Anual',   value: 'YEARLY' }
]

const form = reactive({
  category:             props.transaction?.category ?? '',
  amount:               props.transaction?.amount ?? null as number | null,
  description:          props.transaction?.description ?? '',
  dateObj:              props.transaction ? new Date(props.transaction.date + 'T12:00:00') : new Date(),
  recurring:            props.transaction?.recurring ?? false,
  recurrenceRule:       props.transaction?.recurrenceRule ?? 'MONTHLY',
  recurrenceEndDateObj: props.transaction?.recurrenceEndDate
    ? new Date(props.transaction.recurrenceEndDate + 'T12:00:00')
    : null as Date | null
})

const isValid = computed(() =>
  !!form.category && form.amount !== null && form.amount > 0
)

function toYMD(d: Date | null) {
  if (!d) return undefined
  return d.toISOString().slice(0, 10)
}

function submit() {
  if (!isValid.value) return
  emit('submit', {
    category:          form.category,
    amount:            form.amount,
    description:       form.description || undefined,
    date:              toYMD(form.dateObj),
    recurring:         form.recurring,
    recurrenceRule:    form.recurring ? form.recurrenceRule : undefined,
    recurrenceEndDate: form.recurring ? toYMD(form.recurrenceEndDateObj) : undefined
  })
}
</script>
