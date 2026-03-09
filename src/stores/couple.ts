import { defineStore } from 'pinia'
import { ref } from 'vue'
import { coupleService } from '@/services'
import type { CoupleResponse } from '@/types'

export const useCoupleStore = defineStore('couple', () => {
  const couple = ref<CoupleResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCouple() {
    loading.value = true
    error.value = null
    try {
      couple.value = await coupleService.findMine()
    } catch (e: any) {
      error.value = e?.response?.data?.detail ?? 'Erro ao carregar dados do casal'
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
    } catch (e: any) {
      error.value = e?.response?.data?.detail ?? 'Erro ao criar conta do casal'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function invite(partnerEmail: string) {
    try {
      return await coupleService.invite(partnerEmail)
    } catch (e: any) {
      throw new Error(e?.response?.data?.detail ?? 'Erro ao enviar convite')
    }
  }

  async function join(token: string) {
    try {
      const result = await coupleService.join(token)
      couple.value = result.couple
      return result
    } catch (e: any) {
      throw new Error(e?.response?.data?.detail ?? 'Convite inválido ou expirado')
    }
  }

  function clear() {
    couple.value = null
  }

  return { couple, loading, error, fetchCouple, createCouple, invite, join, clear }
})