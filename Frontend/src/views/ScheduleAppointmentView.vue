<template>
  <section class="schedule-page">
    <PageHero
      pill="Agenda"
      title="Agendar cita"
      subtitle="Registra una nueva consulta eligiendo paciente, fecha, profesional y consultorio."
    >
      <template #actions>
        <RouterLink to="/app/calendario" class="back-link">
          <Calendar :size="18" aria-hidden="true" />
          Ver calendario
        </RouterLink>
      </template>
    </PageHero>

    <div class="kpi-row">
      <article class="kpi surface-card">
        <span class="kpi-icon pend" aria-hidden="true"><Clock :size="20" /></span>
        <div>
          <p class="kpi-label">Pendientes</p>
          <p class="kpi-value">{{ store.appointmentsByStatus('pendiente') }}</p>
        </div>
      </article>
      <article class="kpi surface-card">
        <span class="kpi-icon ok" aria-hidden="true"><CheckCircle2 :size="20" /></span>
        <div>
          <p class="kpi-label">Confirmadas</p>
          <p class="kpi-value">{{ store.appointmentsByStatus('confirmada') }}</p>
        </div>
      </article>
      <article class="kpi surface-card">
        <span class="kpi-icon canc" aria-hidden="true"><CircleX :size="20" /></span>
        <div>
          <p class="kpi-label">Canceladas</p>
          <p class="kpi-value">{{ store.appointmentsByStatus('cancelada') }}</p>
        </div>
      </article>
    </div>

    <transition name="fade-msg">
      <div v-if="savedMessage" class="toast surface-card" role="status">
        <CheckCircle2 :size="22" class="toast-icon" aria-hidden="true" />
        <p>{{ savedMessage }}</p>
      </div>
    </transition>

    <AppointmentForm class="form-wrap" :patients="store.patients" :doctors="store.doctors" @submit="handleSubmit" />
  </section>
</template>

<script setup lang="ts">
import { Calendar, CheckCircle2, CircleX, Clock } from 'lucide-vue-next'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppointmentForm from '../components/appointments/AppointmentForm.vue'
import PageHero from '../components/layout/PageHero.vue'
import type { CreateAppointmentPayload } from '../domain/types'
import { useClinicUiStore } from '../stores/ui'

const store = useClinicUiStore()
const savedMessage = ref('')

const handleSubmit = async (payload: CreateAppointmentPayload) => {
  try {
    await store.createAppointment(payload)
    savedMessage.value = 'Cita registrada correctamente. Ya aparece en el calendario y en el historial.'
  } catch (e) {
    savedMessage.value = e instanceof Error ? e.message : 'No se pudo guardar la cita.'
  }
  setTimeout(() => {
    savedMessage.value = ''
  }, 3200)
}
</script>

<style scoped>
.schedule-page {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  gap: 16px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.kpi {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.kpi-icon.pend {
  background: rgba(200, 155, 60, 0.18);
  color: #9a6b1a;
}
.kpi-icon.ok {
  background: rgba(47, 138, 105, 0.16);
  color: var(--success);
}
.kpi-icon.canc {
  background: rgba(197, 92, 106, 0.14);
  color: var(--danger);
}

.kpi-label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.kpi-value {
  margin: 2px 0 0;
  font-size: 1.35rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--primary-dark);
}

.toast {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(47, 138, 105, 0.35);
  background: linear-gradient(135deg, rgba(240, 252, 248, 0.95), rgba(255, 255, 255, 0.98));
}

.toast-icon {
  flex-shrink: 0;
  color: var(--success);
}

.toast p {
  margin: 0;
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--primary-dark);
}

.fade-msg-enter-active,
.fade-msg-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-msg-enter-from,
.fade-msg-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.form-wrap {
  margin-top: 0;
}

@media (max-width: 720px) {
  .kpi-row {
    grid-template-columns: 1fr;
  }
}
</style>
