import { format } from 'date-fns'

/** Convierte hora 12h + AM/PM a hora 0–23. */
export function to24Hour(hour12: number, meridiem: 'AM' | 'PM'): number {
  if (meridiem === 'AM') return hour12 === 12 ? 0 : hour12
  return hour12 === 12 ? 12 : hour12 + 12
}

/** Convierte hora 0–23 a 12h + AM/PM. */
export function to12Hour(hour24: number): { hour: number; meridiem: 'AM' | 'PM' } {
  if (hour24 === 0) return { hour: 12, meridiem: 'AM' }
  if (hour24 === 12) return { hour: 12, meridiem: 'PM' }
  if (hour24 < 12) return { hour: hour24, meridiem: 'AM' }
  return { hour: hour24 - 12, meridiem: 'PM' }
}

export function localDateFromParts(dateYmd: string, hour24: number, minute: number): Date {
  const [y, m, d] = dateYmd.split('-').map(Number)
  return new Date(y, m - 1, d, hour24, minute, 0, 0)
}

export function dateYmdFromDate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** ISO UTC desde fecha local (misma semántica que el resto de citas). */
export function isoFromLocalParts(dateYmd: string, hour24: number, minute: number): string {
  return localDateFromParts(dateYmd, hour24, minute).toISOString()
}

export function parseIsoToParts(iso: string): {
  dateYmd: string
  hour12: number
  minute: number
  meridiem: 'AM' | 'PM'
} | null {
  if (!iso?.trim()) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const dateYmd = format(d, 'yyyy-MM-dd')
  const h24 = d.getHours()
  const minute = d.getMinutes()
  const { hour, meridiem } = to12Hour(h24)
  return { dateYmd, hour12: hour, minute, meridiem }
}

/** Fecha mínima (hoy) en zona local, yyyy-MM-dd. */
export function minDateYmdLocal(): string {
  return dateYmdFromDate(new Date())
}

/** ¿La fecha/hora local es >= `now` (con margen de 1 min)? */
export function isDateTimeNotInPast(dateYmd: string, hour24: number, minute: number, now = new Date()): boolean {
  const picked = localDateFromParts(dateYmd, hour24, minute)
  return picked.getTime() >= now.getTime() - 60_000
}

/** Minutos en pasos de 5 para citas. */
export const MINUTE_STEP_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const

export function snapMinuteToStep(minute: number): number {
  const step = 5
  const snapped = Math.round(minute / step) * step
  return Math.min(55, Math.max(0, snapped))
}
