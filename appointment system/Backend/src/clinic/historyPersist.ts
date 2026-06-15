import type { SupabaseClient } from '@supabase/supabase-js'
import { historyClientToRow, historyRowToClient } from './mappers.js'
import type { DbHistory } from './mappers.js'

/**
 * Inserta un nuevo registro en el historial de escaneos.
 */
export async function insertHistoryRecord(
  supabase: SupabaseClient,
  record: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const dbRow = historyClientToRow(record)
  
  // Si no viene un ID específico, dejamos que la DB genere el UUID
  if (!dbRow.id) {
    delete dbRow.id
  }

  const { data, error } = await supabase
    .from('history')
    .insert(dbRow)
    .select()
    .single()

  if (error) {
    throw error
  }
  return historyRowToClient(data as DbHistory)
}

/**
 * Obtiene la lista completa de escaneos ordenados de forma descendente por fecha.
 */
export async function getHistoryRecords(
  supabase: SupabaseClient
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('history')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }
  return (data as DbHistory[] ?? []).map(historyRowToClient)
}
