import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/theme.css'
import { fetchClinicTablesFromApi, setClinicTablesCache } from './data/repositories/clinicRepository'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

async function bootstrap() {
  try {
    const tables = await fetchClinicTablesFromApi()
    setClinicTablesCache(tables)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const hint =
      msg === 'Failed to fetch' || msg.includes('NetworkError')
        ? ' Suele indicar que el servidor no está en marcha o la URL no es accesible.'
        : ''
    document.getElementById('app')!.innerHTML = `
    <div style="padding:2rem;max-width:520px;margin:2rem auto;font-family:system-ui,sans-serif;line-height:1.5;">
      <h1 style="font-size:1.1rem;">No se pudo cargar la clínica</h1>
      <p>Comprueba que el backend esté en marcha en <code>${apiUrl}</code> (por ejemplo <code>npm run dev</code> en la carpeta <code>Backend</code>).${hint}</p>
      <p style="font-size:0.9rem;color:#555;">Revisa también <code>VITE_API_URL</code> en <code>Frontend/.env</code> y que Supabase esté configurado en el backend.</p>
      <pre style="background:#f4f4f4;padding:12px;border-radius:8px;overflow:auto;font-size:12px;">${msg}</pre>
    </div>`
    return
  }

  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
}

void bootstrap()
