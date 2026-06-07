import { eachMonthOfInterval, format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

const WINDOW_MONTHS = 6

export type MonthSeries = { labels: string[]; values: number[] }

function monthKey(d: Date): string {
  return format(d, 'yyyy-MM')
}

/** Últimos `WINDOW_MONTHS` meses calendario hasta el mes de `referenceDate`. */
function getMonthBuckets(referenceDate = new Date()): Date[] {
  const end = startOfMonth(referenceDate)
  const start = subMonths(end, WINDOW_MONTHS - 1)
  return eachMonthOfInterval({ start, end })
}

/** Cuenta citas por mes (solo fechas dentro de la ventana). */
export function countAppointmentsByMonth(fechaISOList: string[], referenceDate = new Date()): MonthSeries {
  const months = getMonthBuckets(referenceDate)
  const counts = new Map<string, number>()
  months.forEach((m) => counts.set(monthKey(m), 0))

  for (const iso of fechaISOList) {
    const d = parseISO(iso)
    if (Number.isNaN(d.getTime())) continue
    const key = monthKey(startOfMonth(d))
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return {
    labels: months.map((m) => format(m, 'MMM', { locale: es })),
    values: months.map((m) => counts.get(monthKey(m)) ?? 0),
  }
}

/** Cuenta altas de pacientes (fechaRegistro YYYY-MM-DD) por mes. */
export function countRegistrationsByMonth(
  fechaRegistroList: (string | undefined)[],
  referenceDate = new Date(),
): MonthSeries {
  const months = getMonthBuckets(referenceDate)
  const counts = new Map<string, number>()
  months.forEach((m) => counts.set(monthKey(m), 0))

  for (const fr of fechaRegistroList) {
    if (!fr?.trim()) continue
    const d = parseISO(`${fr.trim()}T12:00:00`)
    if (Number.isNaN(d.getTime())) continue
    const key = monthKey(startOfMonth(d))
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return {
    labels: months.map((m) => format(m, 'MMM', { locale: es })),
    values: months.map((m) => counts.get(monthKey(m)) ?? 0),
  }
}
