import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AxiosError } from 'axios'
import { coupleService } from '@/services'
import type { CoupleResponse } from '@/types'

function apiMessage(e: unknown, fallback: string): string {
  return (e as AxiosError<{ detail?: string }>)?.response?.data?.detail ?? fallback
}

export const useCoupleStore = defineStore('couple', () => {
  const couple = ref<CoupleResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCouple() {
    loading.value = true
    error.value = null
    try {
      couple.value = await coupleService.findMine()
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Erro ao carregar dados do casal')
    } finally {
      loading.value = false
    }
  }

  async function createCouple(name: string) {
    loading.value = true
    error.value = null
    try {
      couple.value = await coupleService.create(name)
      return couple.value
    } catch (e: unknown) {
      error.value = apiMessage(e, 'Erro ao criar conta do casal')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function invite(partnerEmail: string) {
    try {
      return await coupleService.invite(partnerEmail)
    } catch (e: unknown) {
      throw new Error(apiMessage(e, 'Erro ao enviar convite'))
    }
  }

  async function join(token: string) {
    try {
      const result = await coupleService.join(token)
      couple.value = result.couple
      return result
    } catch (e: unknown) {
      throw new Error(apiMessage(e, 'Convite inválido ou expirado'))
    }
  }

  function clear() {
    couple.value = null
  }

  return { couple, loading, error, fetchCouple, createCouple, invite, join, clear }
})