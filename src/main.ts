import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import 'primeicons/primeicons.css'

import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',
      cssLayer: false
    }
  }
})
app.use(ToastService)
app.use(ConfirmationService)

// Inicializa o tema antes do mount para evitar flash de tema errado
import { useThemeStore } from './stores/theme'
const themeStore = useThemeStore()
themeStore.isDark // acessa o getter para disparar a inicialização

app.mount('#app')
