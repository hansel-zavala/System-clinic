import { format, parse } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formato estándar de fecha y hora en la aplicación: 12 h con AM/PM.
 */
export function formatDateTimeSystem(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return format(d, 'dd/MM/yyyy h:mm a')
}

export function formatTimeSystem(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return format(d, 'h:mm a')
}

/** Textos cortos (notificaciones, rangos en el mismo día). */
export function formatDateTimeShort(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return format(d, 'dd/MM h:mm a')
}

/** Fecha larga en español + hora AM/PM. */
export function formatDateTimeLongEs(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const datePart = format(d, "EEEE d 'de' MMMM yyyy", { locale: es })
  const timePart = format(d, 'h:mm a')
  return `${datePart}, ${timePart}`
}

/** Solo fecha en español (sin hora). */
export function formatDateOnlyEs(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return format(d, "EEEE d 'de' MMMM yyyy", { locale: es })
}

/** Fecha almacenada como `yyyy-MM-dd` → `dd/MM/yyyy` (nacimiento, alta). */
export function formatDateFromYyyyMmDd(value: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = parse(value, 'yyyy-MM-dd', new Date())
  return format(d, 'dd/MM/yyyy')
}

/** Etiqueta legible para un día seleccionado `yyyy-MM-dd`. */
export function formatYyyyMmDdLabel(ymd: string): string {
  return formatDateFromYyyyMmDd(ymd)
}

export function formatClockNow(): string {
  return format(new Date(), 'h:mm:ss a')
}

/** Rango de cita: mismo día → inicio corto + fin solo hora; distinto día → dos fechas completas. */
export function formatCalendarRange(startIso: string, endIso: string): string {
  const s = new Date(startIso)
  const e = new Date(endIso)
  const sameDay = s.toDateString() === e.toDateString()
  if (sameDay) {
    return `${format(s, 'dd/MM h:mm a')} – ${format(e, 'h:mm a')}`
  }
  return `${formatDateTimeSystem(s)} – ${formatDateTimeSystem(e)}`
}
