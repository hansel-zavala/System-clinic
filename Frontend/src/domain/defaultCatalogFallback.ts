import type { DuracionOpcion, MotivoConsultaItem } from './types'

/**
 * Catálogo en memoria cuando el API devuelve [] (tablas `motivos_consulta` / `duraciones_opcion`
 * aún no creadas en Supabase). Al ejecutar la migración SQL, el backend sustituye por datos reales.
 * No persistir estos valores hasta que existan las tablas.
 */
export const FALLBACK_MOTIVOS_CONSULTA: MotivoConsultaItem[] = [
  {
    id: 'mot-chequeo',
    codigo: 'chequeo',
    nombreLargo: 'Chequeo general',
    nombreCorto: 'Chequeo',
    activo: true,
  },
  {
    id: 'mot-control',
    codigo: 'control',
    nombreLargo: 'Control o revisión',
    nombreCorto: 'Control',
    activo: true,
  },
  {
    id: 'mot-urgencia',
    codigo: 'urgencia',
    nombreLargo: 'Urgencia',
    nombreCorto: 'Urgencia',
    activo: true,
  },
  {
    id: 'mot-seguimiento',
    codigo: 'seguimiento',
    nombreLargo: 'Seguimiento',
    nombreCorto: 'Seguimiento',
    activo: true,
  },
]

export const FALLBACK_DURACIONES_OPCION: DuracionOpcion[] = [
  { id: 'dur-30', minutos: 30, activo: true },
  { id: 'dur-45', minutos: 45, activo: true },
  { id: 'dur-60', minutos: 60, activo: true },
]

export function applyCatalogFallback(tables: {
  motivosConsulta: MotivoConsultaItem[]
  duracionesOpcion: DuracionOpcion[]
}): void {
  if (!tables.motivosConsulta.length) {
    tables.motivosConsulta.push(...FALLBACK_MOTIVOS_CONSULTA.map((m) => ({ ...m })))
  }
  if (!tables.duracionesOpcion.length) {
    tables.duracionesOpcion.push(...FALLBACK_DURACIONES_OPCION.map((d) => ({ ...d })))
  }
}
