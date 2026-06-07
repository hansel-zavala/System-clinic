import { loadClinicTables } from '../data/repositories/clinicRepository'

/** Texto por defecto si no hay fila en catálogo (p. ej. datos antiguos). */
const LEGACY: Record<string, { long: string; short: string }> = {
  chequeo: { long: 'Chequeo general', short: 'Chequeo' },
  control: { long: 'Control o revisión', short: 'Control' },
  urgencia: { long: 'Urgencia', short: 'Urgencia' },
  seguimiento: { long: 'Seguimiento', short: 'Seguimiento' },
}

export function defaultMotivoConsultaLabel(motivo: string, variant: 'long' | 'short' = 'long'): string {
  const v = LEGACY[motivo]
  if (v) return variant === 'short' ? v.short : v.long
  return motivo
}

export function motivoConsultaLabel(motivo: string, variant: 'long' | 'short' = 'long'): string {
  try {
    const tables = loadClinicTables()
    const row = tables.motivosConsulta?.find((m) => m.codigo === motivo)
    if (row) {
      return variant === 'short' ? row.nombreCorto : row.nombreLargo
    }
  } catch {
    /* cache no cargado */
  }
  return defaultMotivoConsultaLabel(motivo, variant)
}
