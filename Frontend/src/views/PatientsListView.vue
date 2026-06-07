<template>
  <section class="patients-view">
    <header class="head surface-card">
      <PageHero
        pill="Pacientes"
        title="Lista de pacientes"
        subtitle="Vista densa de pacientes con búsqueda, filtros y lectura rápida clínica."
      />
      <div class="kpis">
        <article>
          <p>Visibles</p>
          <strong>{{ visibleCount }}</strong>
        </article>
        <article>
          <p>Femenino</p>
          <strong>{{ femaleCount }}</strong>
        </article>
        <article>
          <p>Masculino</p>
          <strong>{{ maleCount }}</strong>
        </article>
        <article>
          <p>Otro</p>
          <strong>{{ otherCount }}</strong>
        </article>
      </div>
    </header>

    <nav v-if="visibleCount" class="surface-card pagination-bar" aria-label="Paginacion de pacientes">
      <div class="page-size">
        <label for="pat-page-size">Por página</label>
        <select id="pat-page-size" v-model.number="pageSize">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>
      <p class="page-range">{{ rangeLabel }}</p>
      <div class="page-actions">
        <button type="button" class="page-btn" :disabled="currentPage <= 1" @click="goPrev">Anterior</button>
        <span class="page-num">{{ currentPage }} / {{ totalPages }}</span>
        <button type="button" class="page-btn" :disabled="currentPage >= totalPages" @click="goNext">Siguiente</button>
      </div>
    </nav>

    <PatientsTable
      v-model:search="store.search"
      v-model:gender="store.selectedGender"
      :patients="paginatedPatients"
      :total-visible="visibleCount"
      :page-start="pageStart"
      :page-end="pageEnd"
      :can-edit="store.currentRole === 'admin'"
      :can-view-medical-notes="store.currentRole !== 'paciente'"
      @open-detail="openPatientModal"
      @edit-patient="handleEditPatient"
      class="table-block"
    />

    <PatientClinicalModal
      :open="patientModalOpen"
      :patient="selectedPatient"
      @close="closePatientModal"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Patient } from '../domain/types'
import PageHero from '../components/layout/PageHero.vue'
import PatientsTable from '../components/patients/PatientsTable.vue'
import PatientClinicalModal from '../components/modals/PatientClinicalModal.vue'
import { useClinicUiStore } from '../stores/ui'

const store = useClinicUiStore()
const patientModalOpen = ref(false)
const selectedPatient = ref<Patient | null>(null)

const openPatientModal = (patient: Patient) => {
  selectedPatient.value = patient
  patientModalOpen.value = true
}
const closePatientModal = () => {
  patientModalOpen.value = false
  selectedPatient.value = null
}

const pageSize = ref(10)
const currentPage = ref(1)

const visibleCount = computed(() => store.filteredPatients.length)
const femaleCount = computed(() => store.filteredPatients.filter((item) => item.genero === 'F').length)
const maleCount = computed(() => store.filteredPatients.filter((item) => item.genero === 'M').length)
const otherCount = computed(() => store.filteredPatients.filter((item) => item.genero === 'Otro').length)

const totalPages = computed(() => Math.max(1, Math.ceil(visibleCount.value / pageSize.value)))

const paginatedPatients = computed(() => {
  const list = store.filteredPatients
  const start = (currentPage.value - 1) * pageSize.value
  return list.slice(start, start + pageSize.value)
})

const pageStart = computed(() => {
  const total = visibleCount.value
  if (!total) return undefined
  return (currentPage.value - 1) * pageSize.value + 1
})
const pageEnd = computed(() => {
  const total = visibleCount.value
  if (!total) return undefined
  return Math.min(currentPage.value * pageSize.value, total)
})

const rangeLabel = computed(() => {
  const total = visibleCount.value
  if (!total) return 'Sin registros'
  const start = (currentPage.value - 1) * pageSize.value + 1
  const end = Math.min(currentPage.value * pageSize.value, total)
  return `Mostrando ${start}–${end} de ${total}`
})

watch(
  () => [store.search, store.selectedGender] as const,
  () => {
    currentPage.value = 1
  },
)

watch([visibleCount, pageSize], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value)
  }
})

const goPrev = () => {
  currentPage.value = Math.max(1, currentPage.value - 1)
}
const goNext = () => {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1)
}

type AdminPatientEdit = {
  patientId: string
  userPatch: { nombre: string }
  patientPatch: Partial<Pick<Patient, 'telefono' | 'genero' | 'tipoSangre' | 'notasMedico' | 'fechaNacimiento'>> & {
    direccion?: Partial<Patient['direccion']>
  }
  allergiesText: string
  medicationsText: string
}

const handleEditPatient = async (payload: AdminPatientEdit) => {
  const result = await store.updatePatientByAdmin(payload)
  if (!result.ok) {
    window.alert(result.message)
  }
}
</script>

<style scoped>
.patients-view {
  display: grid;
  gap: 14px;
}
.head {
  padding: 14px;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 12px;
  align-items: center;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.kpis article {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.8);
}
.kpis p {
  margin: 0;
  font-size: 0.72rem;
  color: var(--text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.kpis strong {
  display: block;
  margin-top: 2px;
  font-size: 1.2rem;
  color: var(--primary-dark);
}
.table-block {
  margin-top: 0;
}
.feedback {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}
.pagination-bar {
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.page-size {
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-size label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
}
.page-size select {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  font: inherit;
  background: #fff;
}
.page-range {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--primary-dark);
  flex: 1;
  text-align: center;
  min-width: 160px;
}
.page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-btn {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 12px;
  font: inherit;
  font-weight: 700;
  color: var(--primary-dark);
  background: rgba(239, 246, 250, 0.95);
  cursor: pointer;
}
.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.page-num {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 4.5rem;
  text-align: center;
}
@media (max-width: 920px) {
  .head {
    grid-template-columns: 1fr;
  }
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pagination-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .page-range {
    text-align: center;
  }
  .page-actions {
    justify-content: center;
  }
}
</style>
