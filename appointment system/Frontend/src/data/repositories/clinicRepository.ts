import type {
  AllergenCatalog,
  Appointment,
  ChatbotSettings,
  ClinicalEncounter,
  ClinicalNote,
  Consultorio,
  DoctorScheduleSlot,
  DuracionOpcion,
  MedicationCatalog,
  MotivoConsultaItem,
  NotificationItem,
  Patient,
  PatientAllergy,
  PatientMedication,
  UserProfile,
} from '../../domain/types'
import { applyCatalogFallback } from '../../domain/defaultCatalogFallback'

export type ClinicTables = {
  users: UserProfile[]
  patients: Patient[]
  appointments: Appointment[]
  notifications: NotificationItem[]
  consultorios: Consultorio[]
  motivosConsulta: MotivoConsultaItem[]
  duracionesOpcion: DuracionOpcion[]
  allergenCatalog: AllergenCatalog[]
  medicationCatalog: MedicationCatalog[]
  patientAllergies: PatientAllergy[]
  patientMedications: PatientMedication[]
  doctorScheduleSlots: DoctorScheduleSlot[]
  clinicalEncounters: ClinicalEncounter[]
  clinicalNotes: ClinicalNote[]
}

const apiBase = () => import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

let cache: ClinicTables | null = null

export function setClinicTablesCache(tables: ClinicTables) {
  cache = tables
}

export function loadClinicTables(): ClinicTables {
  if (!cache) {
    throw new Error(
      '[clinic] Los datos no están cargados. Asegúrate de llamar a fetchClinicTablesFromApi() antes de montar la app.',
    )
  }
  return cache
}

export async function fetchClinicTablesFromApi(): Promise<ClinicTables> {
  const res = await fetch(`${apiBase()}/api/clinic/tables`)
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `HTTP ${res.status}`)
  }
  const raw = (await res.json()) as Partial<ClinicTables>
  const tables: ClinicTables = {
    users: raw.users ?? [],
    patients: raw.patients ?? [],
    appointments: raw.appointments ?? [],
    notifications: raw.notifications ?? [],
    consultorios: raw.consultorios ?? [],
    motivosConsulta: raw.motivosConsulta ?? [],
    duracionesOpcion: raw.duracionesOpcion ?? [],
    allergenCatalog: raw.allergenCatalog ?? [],
    medicationCatalog: raw.medicationCatalog ?? [],
    patientAllergies: raw.patientAllergies ?? [],
    patientMedications: raw.patientMedications ?? [],
    doctorScheduleSlots: raw.doctorScheduleSlots ?? [],
    clinicalEncounters: raw.clinicalEncounters ?? [],
    clinicalNotes: raw.clinicalNotes ?? [],
  }
  /** Permite cargar la app sin migración SQL; agenda/config usan catálogo en memoria. */
  applyCatalogFallback(tables)
  return tables
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pending: Partial<ClinicTables> = {}
let batchResolvers: Array<{ resolve: () => void; reject: (e: unknown) => void }> = []

export async function persistClinicTables(payload: Partial<ClinicTables>): Promise<void> {
  pending = { ...pending, ...payload }
  return new Promise((resolve, reject) => {
    batchResolvers.push({ resolve, reject })
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      debounceTimer = null
      const toSend = { ...pending }
      pending = {}
      const batch = batchResolvers
      batchResolvers = []
      try {
        const res = await fetch(`${apiBase()}/api/clinic/tables`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toSend),
        })
        if (!res.ok) {
          const t = await res.text()
          throw new Error(t || res.statusText)
        }
        batch.forEach((b) => b.resolve())
      } catch (e) {
        batch.forEach((b) => b.reject(e))
      }
    }, 90)
  })
}

export async function fetchChatbotSettings(): Promise<{
  settings: ChatbotSettings | null
  motivos: MotivoConsultaItem[]
}> {
  const res = await fetch(`${apiBase()}/api/clinic/settings/chatbot`)
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `HTTP ${res.status}`)
  }
  return (await res.json()) as { settings: ChatbotSettings | null; motivos: MotivoConsultaItem[] }
}

export async function updateChatbotSettings(settings: Partial<ChatbotSettings>): Promise<void> {
  const res = await fetch(`${apiBase()}/api/clinic/settings/chatbot`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `HTTP ${res.status}`)
  }
}
