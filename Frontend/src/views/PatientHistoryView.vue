<template>
  <section class="history-view">
    <header class="surface-card head">
      <PageHero
        pill="Historial"
        title="Historial por paciente"
        subtitle="Explora citas registradas con filtros rápidos y lectura cronológica."
      />
      <div class="kpis">
        <article>
          <p>Total</p>
          <strong>{{ filteredAppointments.length }}</strong>
        </article>
        <article>
          <p>Pendientes</p>
          <strong>{{ pendingCount }}</strong>
        </article>
        <article>
          <p>Confirmadas</p>
          <strong>{{ confirmedCount }}</strong>
        </article>
        <article>
          <p>Canceladas</p>
          <strong>{{ cancelledCount }}</strong>
        </article>
      </div>
    </header>

    <section class="surface-card controls">
      <input v-model="search" type="text" placeholder="Buscar por paciente, motivo o médico" />
      <select v-model="status">
        <option value="Todos">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="confirmada">Confirmada</option>
        <option value="cancelada">Cancelada</option>
      </select>
      <button type="button" class="clear-btn" :disabled="!hasFilters" @click="clearFilters">Limpiar filtros</button>
    </section>

    <nav v-if="filteredAppointments.length" class="surface-card pagination-bar" aria-label="Paginacion del historial">
      <div class="page-size">
        <label for="hist-page-size">Por página</label>
        <select id="hist-page-size" v-model.number="pageSize">
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

    <AppointmentTimeline
      :appointments="paginatedAppointments"
      :total-matching="filteredAppointments.length"
      class="mt"
      @open-detail="openAppointmentModal"
    />

    <AppointmentExpedienteModal
      :open="appointmentModalOpen"
      :appointment="selectedAppointment"
      @close="closeAppointmentModal"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageHero from '../components/layout/PageHero.vue'
import AppointmentTimeline from '../components/appointments/AppointmentTimeline.vue'
import AppointmentExpedienteModal from '../components/modals/AppointmentExpedienteModal.vue'
import type { AppointmentStatus, AppointmentView } from '../domain/types'
import { useClinicUiStore } from '../stores/ui'

const store = useClinicUiStore()
const appointmentModalOpen = ref(false)
const selectedAppointment = ref<AppointmentView | null>(null)

const openAppointmentModal = (item: AppointmentView) => {
  selectedAppointment.value = item
  appointmentModalOpen.value = true
}
const closeAppointmentModal = () => {
  appointmentModalOpen.value = false
  selectedAppointment.value = null
}

const search = ref('')
const status = ref<'Todos' | AppointmentStatus>('Todos')
const pageSize = ref(10)
const currentPage = ref(1)

const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const filteredAppointments = computed(() =>
  store.roleVisibleAppointments
    .filter((item) => {
      const byStatus = status.value === 'Todos' || item.estado === status.value
      const term = normalizedSearch.value
      if (!term) return byStatus
      const haystack = `${item.pacienteNombre} ${item.motivo} ${item.medicoAsignado}`.toLowerCase()
      return byStatus && haystack.includes(term)
    })
    .slice()
    .sort((a, b) => new Date(b.fechaISO).getTime() - new Date(a.fechaISO).getTime()),
)

const totalFiltered = computed(() => filteredAppointments.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalFiltered.value / pageSize.value)))

const paginatedAppointments = computed(() => {
  const list = filteredAppointments.value
  const start = (currentPage.value - 1) * pageSize.value
  return list.slice(start, start + pageSize.value)
})

const rangeLabel = computed(() => {
  const total = totalFiltered.value
  if (!total) return 'Sin registros'
  const start = (currentPage.value - 1) * pageSize.value + 1
  const end = Math.min(currentPage.value * pageSize.value, total)
  return `Mostrando ${start}–${end} de ${total}`
})

watch([normalizedSearch, status], () => {
  currentPage.value = 1
})

watch([totalFiltered, pageSize], () => {
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

const pendingCount = computed(() => filteredAppointments.value.filter((item) => item.estado === 'pendiente').length)
const confirmedCount = computed(() => filteredAppointments.value.filter((item) => item.estado === 'confirmada').length)
const cancelledCount = computed(() => filteredAppointments.value.filter((item) => item.estado === 'cancelada').length)
const hasFilters = computed(() => Boolean(normalizedSearch.value) || status.value !== 'Todos')
const clearFilters = () => {
  search.value = ''
  status.value = 'Todos'
}
</script>

<style scoped>
.history-view {
  display: grid;
  gap: 12px;
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
  background: rgba(255, 255, 255, 0.78);
}
.kpis p {
  margin: 0;
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.kpis strong {
  margin-top: 2px;
  display: block;
  font-size: 1.2rem;
  color: var(--primary-dark);
}
.controls {
  padding: 12px;
  display: flex;
  gap: 8px;
}
.controls input,
.controls select {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  font: inherit;
  background: #fff;
}
.controls input {
  flex: 1;
}
.clear-btn {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 11px;
  font: inherit;
  font-weight: 700;
  color: var(--primary-dark);
  background: rgba(239, 246, 250, 0.9);
  cursor: pointer;
}
.clear-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.mt {
  margin-top: 0;
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
@media (max-width: 960px) {
  .head {
    grid-template-columns: 1fr;
  }
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .controls {
    flex-wrap: wrap;
  }
  .controls input,
  .controls select,
  .clear-btn {
    width: 100%;
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
