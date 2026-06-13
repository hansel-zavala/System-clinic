import { computed, type Ref } from 'vue'
import type {
  AllergenCatalog,
  MedicationCatalog,
  Patient,
  PatientAllergy,
  PatientMedication,
  UserProfile,
} from '../../domain/types'
import {
  allergiesSummary,
  matchAllergenId,
  matchMedicationId,
  medicationsSummary,
  patientCorreo,
  patientNombre,
} from '../../domain/clinicJoins'
import { patientAge } from '../../domain/ageFromBirth'
import { persistClinicTables } from '../../data/repositories/clinicRepository'
import { newNumericId } from '../../domain/generateId'

export function createPatientHelpers(
  users: Ref<UserProfile[]>,
  patientAllergies: Ref<PatientAllergy[]>,
  allergenCatalog: Ref<AllergenCatalog[]>,
  patientMedications: Ref<PatientMedication[]>,
  medicationCatalog: Ref<MedicationCatalog[]>,
) {
  const patientDisplayName = (patient: Patient) => patientNombre(patient, users.value)
  const patientDisplayEmail = (patient: Patient) => patientCorreo(patient, users.value)
  const patientAllergiesLine = (patient: Patient) =>
    allergiesSummary(patient.id, patientAllergies.value, allergenCatalog.value)
  const patientMedicationsLine = (patient: Patient) =>
    medicationsSummary(patient.id, patientMedications.value, medicationCatalog.value)

  const syncPatientAllergiesFromPlainText = async (patientId: string, text: string) => {
    const pid = String(patientId).trim()
    const raw = text.trim()
    const lower = raw.toLowerCase()
    const rest = patientAllergies.value.filter((a) => String(a.patientId) !== pid)
    if (!raw || lower === 'ninguna' || lower === 'ninguno') {
      patientAllergies.value = rest
      await persistClinicTables({ patientAllergies: patientAllergies.value })
      return
    }
    const parts = raw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((p) => p.toLowerCase() !== 'ninguna' && p.toLowerCase() !== 'ninguno')
    const now = new Date().toISOString()
    for (const part of parts) {
      const allergenId = matchAllergenId(allergenCatalog.value, part)
      rest.push({
        id: newNumericId(),
        patientId: pid,
        allergenId,
        detalleLibre: allergenId ? null : part,
        severidad: 'no_especificada',
        notas: null,
        registradoEn: now,
      })
    }
    patientAllergies.value = rest
    await persistClinicTables({ patientAllergies: patientAllergies.value })
  }

  const syncPatientMedicationsFromPlainText = async (patientId: string, text: string) => {
    const pid = String(patientId).trim()
    const raw = text.trim()
    const lower = raw.toLowerCase()
    const rest = patientMedications.value.filter((m) => String(m.patientId) !== pid)
    if (!raw || lower === 'ninguna' || lower === 'ninguno') {
      patientMedications.value = rest
      await persistClinicTables({ patientMedications: patientMedications.value })
      return
    }
    const parts = raw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((p) => p.toLowerCase() !== 'ninguna' && p.toLowerCase() !== 'ninguno')
    const now = new Date().toISOString()
    for (const part of parts) {
      const medicationId = matchMedicationId(medicationCatalog.value, part)
      rest.push({
        id: newNumericId(),
        patientId: pid,
        medicationId,
        nombreLibre: medicationId ? null : part,
        dosis: null,
        frecuencia: null,
        activo: true,
        fechaInicio: null,
        fechaFin: null,
        notas: null,
        registradoEn: now,
      })
    }
    patientMedications.value = rest
    await persistClinicTables({ patientMedications: patientMedications.value })
  }

  return {
    patientDisplayName,
    patientDisplayEmail,
    patientAllergiesLine,
    patientMedicationsLine,
    syncPatientAllergiesFromPlainText,
    syncPatientMedicationsFromPlainText,
  }
}

export function createFilteredPatients(
  patients: Ref<Patient[]>,
  search: Ref<string>,
  selectedGender: Ref<'Todos' | 'F' | 'M' | 'Otro'>,
  patientDisplayName: (patient: Patient) => string,
  patientDisplayEmail: (patient: Patient) => string,
) {
  return computed(() => {
    const term = search.value.trim().toLowerCase()
    return patients.value.filter((patient) => {
      const nombre = patientDisplayName(patient)
      const correo = patientDisplayEmail(patient)
      const matchesTerm =
        nombre.toLowerCase().includes(term) ||
        correo.toLowerCase().includes(term) ||
        String(patientAge(patient)).includes(term) ||
        patient.telefono.includes(term)

      const matchesGender = selectedGender.value === 'Todos' || patient.genero === selectedGender.value
      return matchesTerm && matchesGender
    })
  })
}
