import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { registerClinicRoutes } from './clinic/routes.js'

const PORT = Number(process.env.PORT) || 4000

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabase: SupabaseClient | null = null
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
} else {
  console.warn(
    '[backend] Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Backend/.env',
  )
}

const app = express()
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) ?? true,
  }),
)
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'clinica-aura-backend' })
})

/** Comprueba que PostgREST responde y que existen tablas/migración aplicada. */
registerClinicRoutes(app, supabase)

app.get('/api/db/status', async (_req, res) => {
  if (!supabase) {
    return res.status(503).json({
      connected: false,
      error: 'Supabase no configurado. Copia .env.example a .env y rellena las claves.',
    })
  }

  const { data, error } = await supabase.from('consultorios').select('id, codigo, nombre').limit(10)

  if (error) {
    return res.status(500).json({
      connected: false,
      error: error.message,
      hint: 'Ejecuta las migraciones en Supabase (SQL Editor o supabase db push).',
    })
  }

  res.json({
    connected: true,
    table: 'consultorios',
    count: data?.length ?? 0,
    rows: data,
  })
})

app.listen(PORT, () => {
  console.log(`Clinica backend: http://localhost:${PORT}`)
  console.log(`  GET /health`)
  console.log(`  GET /api/db/status`)
})
