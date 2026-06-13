import type {
  Appointment,
  AppointmentView,
  Consultorio,
  MedicationCatalog,
  Patient,
  PatientAllergy,
  PatientMedication,
  AllergenCatalog,
  UserProfile,
} from './types'

export const matchAllergenId = (catalog: AllergenCatalog[], label: string): string | null => {
  const t = label.trim().toLowerCase()
  return catalog.find((c) => c.nombre.toLowerCase() === t)?.id ?? null
}

export const matchMedicationId = (catalog: MedicationCatalog[], label: string): string | null => {
  const t = label.trim().toLowerCase()
  return catalog.find((c) => c.nombre.toLowerCase() === t)?.id ?? null
}

export const userById = (users: UserProfile[], id: string) => users.find((u) => u.id === id)

export const patientNombre = (patient: Patient, users: UserProfile[]) =>
  userById(users, patient.userId)?.nombre ?? '—'

export const patientCorreo = (patient: Patient, users: UserProfile[]) =>
  userById(users, patient.userId)?.correo ?? ''

export function enrichAppointment(
  a: Appointment,
  users: UserProfile[],
  patients: Patient[],
  consultorios: Consultorio[],
): AppointmentView {
  const patient = patients.find((p) => p.id === a.pacienteId)
  const pu = patient ? userById(users, patient.userId) : undefined
  const mu = userById(users, a.medicoUserId)
  const room = consultorios.find((c) => c.id === a.consultorioId)
  return {
    ...a,
    pacienteNombre: pu?.nombre ?? 'Desconocido',
    medicoAsignado: mu?.nombre ?? 'Desconocido',
    salaConsultorio: room?.codigo ?? '',
    consultorioNombre: room?.nombre,
  }
}

export function allergiesSummary(
  patientId: string,
  rows: PatientAllergy[],
  catalog: AllergenCatalog[],
): string {
  const pid = String(patientId)
  const list = rows.filter((r) => String(r.patientId) === pid)
  if (!list.length) return ''
  return list
    .map((r) => {
      if (r.allergenId) {
        const name = catalog.find((c) => c.id === r.allergenId)?.nombre
        return name ?? r.detalleLibre ?? ''
      }
      return r.detalleLibre ?? ''
    })
    .filter(Boolean)
    .join(', ')
}

export function medicationsSummary(
  patientId: string,
  rows: PatientMedication[],
  catalog: MedicationCatalog[],
): string {
  const pid = String(patientId)
  const list = rows.filter((r) => String(r.patientId) === pid && r.activo)
  if (!list.length) return ''
  return list
    .map((r) => {
      const base =
        r.medicationId ? catalog.find((c) => c.id === r.medicationId)?.nombre : r.nombreLibre
      return base ? [base, r.dosis].filter(Boolean).join(' ') : ''
    })
    .filter(Boolean)
    .join('; ')
}
