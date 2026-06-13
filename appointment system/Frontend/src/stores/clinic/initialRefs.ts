import { ref } from 'vue'
import { loadClinicTables } from '../../data/repositories/clinicRepository'

/** Estado persistido cargado una sola vez al crear el store. */
export function createInitialRefs() {
  const tables = loadClinicTables()
  return {
    search: ref(''),
    selectedGender: ref<'Todos' | 'F' | 'M' | 'Otro'>('Todos'),
    users: ref(tables.users),
    patients: ref(tables.patients),
    appointments: ref(tables.appointments),
    notifications: ref(tables.notifications),
    consultorios: ref(tables.consultorios),
    motivosConsulta: ref(tables.motivosConsulta),
    duracionesOpcion: ref(tables.duracionesOpcion),
    allergenCatalog: ref(tables.allergenCatalog),
    medicationCatalog: ref(tables.medicationCatalog),
    patientAllergies: ref(tables.patientAllergies),
    patientMedications: ref(tables.patientMedications),
  }
}
