import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AxiosError } from 'axios'
import { goalService } from '@/services'
import type { GoalResponse, GoalProgressResponse } from '@/types'
import type { CreateGoalPayload, UpdateGoalPayload } from '@/services'

function apiMessage(e: unknown, fallback: string): string {
  return (e as AxiosError<{ detail?: string }>)?.response?.data?.detail ?? fallback
}

export const useGoalStore = defineStore('goal', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  const goals      = ref<GoalResponse[]>([])
  const progress   = ref<GoalProgressResponse[]>([])
  const loading    = ref(false)
  const submitting = ref(false)
  const error      = ref<string | null>(null)

  // ── Actions ────────────────────────────────────────────────────────────────

  async function fetchGoals() {
    loading.value = true
    error.value   = null
    try {
      goals.value = (await goalService.list()) ?? []
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Erro ao carregar metas')
    } finally {
      loading.value = false
    }
  }

  async function fetchProgress() {
    loading.value = true
    error.value   = null
    try {
      progress.value = (await goalService.progress()) ?? []
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Erro ao carregar progresso das metas')
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateGoalPayload) {
    submitting.value = true
    error.value      = null
    try {
      const created = await goalService.create(payload)
      goals.value = [...goals.value, created]
      return created
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Erro ao criar meta')
      throw e
    } finally {
      submitting.value = false
    }
  }

  async function update(id: string, payload: UpdateGoalPayload) {
    submitting.value = true
    error.value      = null
    try {
      const updated = await goalService.update(id, payload)
      goals.value = goals.value.map(g => g.id === id ? updated : g)
      return updated
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Erro ao atualizar meta')
      throw e
    } finally {
      submitting.value = false
    }
  }

  async function toggle(id: string) {
    submitting.value = true
    error.value      = null
    try {
      const updated = await goalService.toggle(id)
      goals.value = goals.value.map(g => g.id === id ? updated : g)
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Erro ao alterar meta')
      throw e
    } finally {
      submitting.value = false
    }
  }

  async function remove(id: string) {
    submitting.value = true
    error.value      = null
    try {
      await goalService.delete(id)
      goals.value    = goals.value.filter(g => g.id !== id)
      progress.value = progress.value.filter(p => p.id !== id)
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Erro ao remover meta')
      throw e
    } finally {
      submitting.value = false
    }
  }

  return {
    goals, progress, loading, submitting, error,
    fetchGoals, fetchProgress, create, update, toggle, remove
  }
})
