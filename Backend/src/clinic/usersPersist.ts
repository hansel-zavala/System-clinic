import type { SupabaseClient } from '@supabase/supabase-js'
import { userClientToRow } from './mappers.js'
import { hashPasswordIfNeeded } from './passwordCrypto.js'

/**
 * Convierte usuarios del cliente a filas DB con password_hash:
 * - Si viene `password` no vacío → hashea (o conserva si ya es bcrypt).
 * - Si no viene contraseña → conserva el hash existente en BD (no borrar).
 */
export async function buildUserRowsForUpsert(
  supabase: SupabaseClient,
  clientUsers: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const ids = clientUsers.map((u) => String(u.id)).filter(Boolean)
  if (!ids.length) return []

  const { data: existing } = await supabase.from('users').select('id, password_hash').in('id', ids)
  const existingMap = new Map(
    (existing ?? []).map((r: { id: string; password_hash: string | null }) => [r.id, r.password_hash]),
  )

  const rows: Record<string, unknown>[] = []
  for (const u of clientUsers) {
    const id = String(u.id)
    let passwordHash: string | null = existingMap.get(id) ?? null
    const pw = u.password
    if (typeof pw === 'string' && pw.trim() !== '') {
      passwordHash = await hashPasswordIfNeeded(pw.trim())
    }
    rows.push(userClientToRow({ ...u, password: passwordHash ?? undefined }))
  }
  return rows
}
