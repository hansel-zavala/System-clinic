import { differenceInYears, isValid, parseISO } from 'date-fns'
import type { Patient } from './types'

/** ISO fecha solo (YYYY-MM-DD) -> edad en años cumplidos a hoy. */
export function ageFromBirthDate(isoYmd: string): number {
  const birth = parseISO(isoYmd)
  if (!isValid(birth)) return 0
  return Math.max(0, differenceInYears(new Date(), birth))
}

/** Edad mostrada: desde fecha de nacimiento si existe; si no, campo legacy `edad`. */
export function patientAge(patient: Patient): number {
  if (patient.fechaNacimiento) {
    return ageFromBirthDate(patient.fechaNacimiento)
  }
  return patient.edad
}

/** Fecha válida: pasada, no demasiado antigua (p.ej. &lt;= 120 años). */
export function isValidBirthDateForRegistration(isoYmd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoYmd.trim())) return false
  const birth = parseISO(isoYmd)
  if (!isValid(birth)) return false
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (birth.getTime() > today.getTime()) return false
  const age = ageFromBirthDate(isoYmd)
  return age <= 120
}
