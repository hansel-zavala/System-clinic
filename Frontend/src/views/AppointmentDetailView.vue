<template>
  <section class="detail-view">
    <PageHero
      pill="Agenda"
      title="Detalle de cita"
      subtitle="Revisa la información de la consulta y gestiona el estado o la fecha."
    >
      <template #actions>
        <RouterLink to="/app/calendario" class="back-link">
          <Calendar :size="18" aria-hidden="true" />
          Calendario
        </RouterLink>
      </template>
    </PageHero>

    <article class="surface-card selector-card">
      <label class="selector-label" for="cita-select">
        <ListFilter :size="18" aria-hidden="true" />
        <span>Elegir cita</span>
      </label>
      <select id="cita-select" v-model="selectedId" class="selector-input">
        <option v-for="item in sortedAppointments" :key="item.id" :value="item.id">
          {{ formatDateTime(item.fechaISO) }} — {{ item.pacienteNombre }} — {{ motivoLabel(item.motivo) }}
        </option>
      </select>
      <p v-if="sortedAppointments.length" class="selector-hint">
        {{ sortedAppointments.length }} cita(s) en tu vista · ordenadas por fecha más reciente
      </p>
    </article>

    <article v-if="appointment" class="surface-card card main-card">
      <div class="hero">
        <div class="hero-main">
          <p class="patient-label">Paciente</p>
          <h2 class="patient-name">{{ appointment.pacienteNombre }}</h2>
          <div class="chips">
            <span class="chip chip-motivo">{{ motivoLabel(appointment.motivo) }}</span>
            <StatusBadge :value="appointment.estado" />
          </div>
        </div>
        <div class="datetime-block">
          <p class="dt-label">Inicio</p>
          <p class="dt-date">{{ formatDateOnly(appointment.fechaISO) }}</p>
          <p class="dt-time">{{ formatTime(appointment.fechaISO) }}</p>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-icon" aria-hidden="true"><CalendarDays :size="20" /></span>
          <div>
            <p class="detail-k">Fecha</p>
            <p class="detail-v">{{ formatDateOnly(appointment.fechaISO) }}</p>
          </div>
        </div>
        <div class="detail-item">
          <span class="detail-icon" aria-hidden="true"><Clock :size="20" /></span>
          <div>
            <p class="detail-k">Hora</p>
            <p class="detail-v">{{ formatTime(appointment.fechaISO) }}</p>
          </div>
        </div>
        <div class="detail-item">
          <span class="detail-icon" aria-hidden="true"><Timer :size="20" /></span>
          <div>
            <p class="detail-k">Duración</p>
            <p class="detail-v">{{ appointment.duracionMin }} minutos</p>
          </div>
        </div>
        <div class="detail-item">
          <span class="detail-icon" aria-hidden="true"><Stethoscope :size="20" /></span>
          <div>
            <p class="detail-k">Médico</p>
            <p class="detail-v">{{ appointment.medicoAsignado }}</p>
          </div>
        </div>
        <div class="detail-item detail-item--wide">
          <span class="detail-icon" aria-hidden="true"><MapPin :size="20" /></span>
          <div>
            <p class="detail-k">Consultorio / sala</p>
            <p class="detail-v">{{ appointment.salaConsultorio || appointment.consultorioNombre || 'No definida' }}</p>
          </div>
        </div>
      </div>

      <div class="notes-block">
        <p class="notes-head">
          <FileText :size="18" aria-hidden="true" />
          Notas de la cita
        </p>
        <p class="notes-text">{{ appointment.notas || 'Sin notas registradas para esta cita.' }}</p>
      </div>

      <div class="actions">
        <button
          type="button"
          class="btn btn-danger"
          :disabled="appointment.estado === 'cancelada'"
          @click="onCancel"
        >
          <Ban :size="18" aria-hidden="true" />
          Cancelar cita
        </button>
        <button type="button" class="btn btn-secondary" @click="onReschedule">
          <CalendarClock :size="18" aria-hidden="true" />
          Reagendar (+1 día)
        </button>
      </div>
      <p v-if="message" class="message">{{ message }}</p>
    </article>

    <article v-else class="surface-card empty-card">
      <div class="empty-inner">
        <CalendarX2 :size="44" class="empty-icon" aria-hidden="true" />
        <h3 class="empty-title">No hay citas</h3>
        <p class="empty-text">No tienes citas en la vista actual o aún no se ha registrado ninguna.</p>
        <RouterLink v-if="store.canScheduleAppointments" to="/app/agendar-cita" class="empty-cta"
          >Agendar cita</RouterLink
        >
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import {
  Ban,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarX2,
  Clock,
  FileText,
  ListFilter,
  MapPin,
  Stethoscope,
  Timer,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageHero from '../components/layout/PageHero.vue'
import StatusBadge from '../components/ui/StatusBadge.vue'
import { formatDateOnlyEs, formatDateTimeSystem, formatTimeSystem } from '../domain/datetimeDisplay'
import { motivoConsultaLabel } from '../domain/motivoConsulta'
import type { AppointmentView } from '../domain/types'
import { useClinicUiStore } from '../stores/ui'

const store = useClinicUiStore()
const message = ref('')

const motivoLabel = (m: AppointmentView['motivo']) => motivoConsultaLabel(m, 'short')

const sortedAppointments = computed(() =>
  store.roleVisibleAppointments.slice().sort((a, b) => new Date(b.fechaISO).getTime() - new Date(a.fechaISO).getTime()),
)
const selectedId = ref<string>('')
const appointment = computed(() => {
  if (!sortedAppointments.value.length) return null
  if (!selectedId.value) {
    selectedId.value = sortedAppointments.value[0].id
  }
  return sortedAppointments.value.find((item) => item.id === selectedId.value) ?? sortedAppointments.value[0]
})
const formatDateTime = (iso: string) => formatDateTimeSystem(iso)
const formatDateOnly = (iso: string) => formatDateOnlyEs(iso)
const formatTime = (iso: string) => formatTimeSystem(iso)

const onCancel = async () => {
  if (!appointment.value) return
  try {
    await store.cancelAppointment(appointment.value.id)
    message.value = 'Cita cancelada y notificación creada.'
  } catch (e) {
    message.value = e instanceof Error ? e.message : 'Error al cancelar.'
  }
}

const onReschedule = async () => {
  if (!appointment.value) return
  try {
    await store.rescheduleAppointment(appointment.value.id)
    message.value = 'Cita reagendada para el día siguiente.'
  } catch (e) {
    message.value = e instanceof Error ? e.message : 'Error al reagendar.'
  }
}
</script>

<style scoped>
.detail-view {
  max-width: 820px;
  margin: 0 auto;
  display: grid;
  gap: 16px;
}

.selector-card {
  padding: 16px 18px;
  display: grid;
  gap: 10px;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--primary-dark);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.selector-label svg {
  color: var(--primary);
  opacity: 0.9;
}

.selector-input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 11px;
  padding: 11px 12px;
  font: inherit;
  font-size: 0.92rem;
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-main);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.selector-input:hover {
  border-color: rgba(58, 143, 183, 0.35);
}
.selector-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(58, 143, 183, 0.2);
}

.selector-hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.main-card {
  padding: 0;
  overflow: hidden;
}

.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 20px 18px;
  background: linear-gradient(140deg, rgba(223, 240, 248, 0.65), rgba(255, 255, 255, 0.92));
  border-bottom: 1px solid var(--border);
}

.patient-label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
}

.patient-name {
  margin: 4px 0 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.45rem, 2.5vw, 1.85rem);
  font-weight: 600;
  color: var(--primary-dark);
  line-height: 1.2;
}

.chips {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.chip-motivo {
  background: rgba(112, 189, 178, 0.22);
  color: #1d5c54;
  border: 1px solid rgba(112, 189, 178, 0.35);
}

.datetime-block {
  min-width: 140px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(58, 143, 183, 0.2);
  box-shadow: 0 4px 14px rgba(42, 87, 115, 0.08);
  text-align: right;
}

.dt-label {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.dt-date {
  margin: 6px 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.3;
}

.dt-time {
  margin: 4px 0 0;
  font-size: 1.65rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--primary-dark);
  letter-spacing: 0.02em;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 16px 18px;
}

.detail-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(248, 252, 255, 0.85);
}

.detail-item--wide {
  grid-column: 1 / -1;
}

.detail-icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(58, 143, 183, 0.12);
  color: var(--primary-dark);
}

.detail-k {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.detail-v {
  margin: 4px 0 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.35;
}

.notes-block {
  margin: 0 18px 18px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(240, 249, 246, 0.5));
}

.notes-head {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary-dark);
}

.notes-head svg {
  color: var(--primary);
  opacity: 0.85;
}

.notes-text {
  margin: 10px 0 0;
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--text-main);
}

.actions {
  padding: 0 18px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 11px;
  padding: 11px 16px;
  font: inherit;
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
}

.btn:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-danger {
  color: #fff;
  background: linear-gradient(135deg, #c55c6a, #a84858);
  box-shadow: 0 4px 14px rgba(197, 92, 106, 0.35);
}
.btn-danger:hover:not(:disabled) {
  box-shadow: 0 6px 18px rgba(197, 92, 106, 0.35);
}

.btn-secondary {
  color: var(--primary-dark);
  background: rgba(233, 241, 245, 0.95);
  border: 1px solid var(--border);
}
.btn-secondary:hover {
  background: #e3eef4;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.message {
  margin: 0 18px 18px;
  padding: 10px 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--success);
  background: rgba(47, 138, 105, 0.1);
  border: 1px solid rgba(47, 138, 105, 0.22);
}

.empty-card {
  padding: 32px 20px;
}

.empty-inner {
  max-width: 360px;
  margin: 0 auto;
  text-align: center;
}

.empty-icon {
  color: var(--text-muted);
  opacity: 0.65;
}

.empty-title {
  margin: 14px 0 8px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.35rem;
  color: var(--primary-dark);
}

.empty-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.empty-cta {
  display: inline-flex;
  margin-top: 16px;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(125deg, var(--primary), var(--secondary));
  box-shadow: 0 6px 18px rgba(58, 143, 183, 0.25);
}

@media (max-width: 640px) {
  .hero {
    flex-direction: column;
  }
  .datetime-block {
    width: 100%;
    text-align: left;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
