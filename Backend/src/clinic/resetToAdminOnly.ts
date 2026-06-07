import type { SupabaseClient } from '@supabase/supabase-js'
import { consultorioClientToRow, userClientToRow } from './mappers.js'
import { hashPassword } from './passwordCrypto.js'

/** Orden: hijos antes que padres (FK). */
const TABLES_DELETE_ORDER = [
  'clinical_notes',
  'clinical_encounters',
  'patient_allergies',
  'patient_medications',
  'notifications',
  'appointments',
  'doctor_schedule_slots',
  'patients',
  'users',
  'consultorios',
  'allergen_catalog',
  'medication_catalog',
] as const

async function deleteAllRows(supabase: SupabaseClient, table: string) {
  const { data: rows, error } = await supabase.from(table).select('id')
  if (error) throw new Error(`${table}: ${error.message}`)
  const ids = (rows ?? []).map((r) => String((r as { id: string }).id))
  const chunk = 200
  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk)
    const { error: delErr } = await supabase.from(table).delete().in('id', slice)
    if (delErr) throw new Error(`${table} delete: ${delErr.message}`)
  }
}

function newNumericId(): string {
  const t = Date.now()
  const r = Math.floor(Math.random() * 1_000_000)
  return `${t}${String(r).padStart(6, '0')}`
}

const DEFAULT_CONSULTORIOS = [
  { id: '1', codigo: 'Consultorio 1', nombre: 'Planta baja', activo: true },
  { id: '2', codigo: 'Consultorio 2', nombre: 'Primer piso', activo: true },
  { id: '3', codigo: 'Consultorio 3', nombre: 'Urgencias', activo: true },
]

export type ResetAdminOptions = {
  adminId?: string
  nombre?: string
  correo?: string
  password?: string
}

/**
 * Borra todos los datos y deja solo un usuario admin + catálogo mínimo de consultorios
 * (sin salas la agenda no puede asignar sala; no son “usuarios”).
 */
export async function resetDatabaseToAdminOnly(
  supabase: SupabaseClient,
  options: ResetAdminOptions = {},
): Promise<{ ok: true; adminId: string; correo: string } | { ok: false; message: string }> {
  const adminId = options.adminId ?? newNumericId()
  const nombre = options.nombre ?? 'Administrador'
  const correo = options.correo ?? 'admin@clinica.local'
  const password = options.password ?? 'Admin123!'

  try {
    for (const table of TABLES_DELETE_ORDER) {
      await deleteAllRows(supabase, table)
    }

    const consultorioRows = DEFAULT_CONSULTORIOS.map((c) => consultorioClientToRow(c as Record<string, unknown>))
    const { error: cErr } = await supabase.from('consultorios').upsert(consultorioRows, { onConflict: 'id' })
    if (cErr) throw new Error(`consultorios: ${cErr.message}`)

    const passwordHash = await hashPassword(password)

    const adminUser = {
      id: adminId,
      nombre,
      correo,
      password: passwordHash,
      rol: 'admin',
      especialidad: 'Administracion clinica',
      horarioDisponible: '',
      fotoUrl: 'https://i.pravatar.cc/180?img=32',
      firmaDigital: nombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? '')
        .join('') || 'AD',
    }
    const userRow = userClientToRow(adminUser as Record<string, unknown>)
    const { error: uErr } = await supabase.from('users').upsert([userRow], { onConflict: 'id' })
    if (uErr) throw new Error(`users: ${uErr.message}`)

    return { ok: true, adminId, correo }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, message }
  }
}
