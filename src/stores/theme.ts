import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  // Lê preferência salva ou usa preferência do sistema operacional
  const savedPreference = localStorage.getItem('theme')
  const systemDark      = window.matchMedia('(prefers-color-scheme: dark)').matches

  const isDark = ref(
    savedPreference === 'dark' ? true :
    savedPreference === 'light' ? false :
    systemDark
  )

  // ── Aplicar na inicialização ───────────────────────────────────────────────

  applyTheme(isDark.value)

  // ── Watch: aplica imediatamente ao mudar ──────────────────────────────────

  watch(isDark, (dark) => {
    applyTheme(dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  })

  // ── Actions ────────────────────────────────────────────────────────────────

  function toggle() {
    isDark.value = !isDark.value
  }

  function setDark(value: boolean) {
    isDark.value = value
  }

  return { isDark, toggle, setDark }
})

function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
