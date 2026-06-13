<template>
  <section class="dashboard-split">
    <div class="top-half">
      <article class="hero surface-card medical-pattern">
        <div>
          <div
            v-if="welcomeLine"
            class="welcome-inline"
            :class="welcomeRoleClass"
            role="region"
            aria-label="Bienvenida"
          >
            <p class="welcome-kicker">{{ welcomeKicker }}</p>
            <p class="welcome-text">{{ welcomeLine }}</p>
          </div>
          <h1 class="page-title">Centro Clinico Inteligente</h1>
          <p class="page-subtitle">
            {{ dashboardSubtitle }}
          </p>
          <div class="hero-actions">
            <RouterLink v-if="store.canScheduleAppointments" to="/agendar-cita" class="cta primary"
              >Nueva cita</RouterLink
            >
            <RouterLink to="/calendario" class="cta secondary">Ver calendario</RouterLink>
          </div>
          <div class="medical-icons">
            <span><HeartPulse :size="14" /> Monitoreo</span>
            <span><Cross :size="14" /> Atencion</span>
            <span><Syringe :size="14" /> Tratamiento</span>
          </div>
        </div>
        <div class="hero-right">
          <div class="pulse">
            <p class="pulse-label">Hora actual</p>
            <p class="pulse-time">{{ currentTime }}</p>
          </div>
          <ClinicIllustration />
        </div>
      </article>

      <section class="stats">
        <StatCard label="Citas hoy" :value="store.todaysAppointments.length" caption="Agenda del día">
          <template #icon><CalendarCheck2 :size="18" /></template>
        </StatCard>
        <StatCard label="Pendientes" :value="store.appointmentsByStatus('pendiente')" caption="Por confirmar">
          <template #icon><ClipboardPlus :size="18" /></template>
        </StatCard>
        <StatCard label="Canceladas" :value="store.appointmentsByStatus('cancelada')" caption="Reagendar sugerido">
          <template #icon><CircleX :size="18" /></template>
        </StatCard>
      </section>
    </div>

    <div class="bottom-half">
      <div class="grid-2">
        <MonthlyAppointmentsChart
          title="Tendencia de citas"
          dataset-label="Citas"
          :labels="store.chartDataByMonth.labels"
          :values="store.chartDataByMonth.values"
        />
        <MonthlyAppointmentsChart
          title="Nuevos pacientes"
          dataset-label="Altas"
          :labels="store.newPatientsByMonth.labels"
          :values="store.newPatientsByMonth.values"
        />
      </div>

      <article class="surface-card upcoming">
        <div class="upcoming-head">
          <h2>Proximas citas</h2>
          <RouterLink to="/detalle-cita" class="details-link">Abrir detalle</RouterLink>
        </div>
        <p class="upcoming-caption">Se muestran las citas futuras mas cercanas.</p>
        <ul v-if="upcomingAppointments.length">
          <li v-for="item in upcomingAppointments" :key="item.id">
            <div>
              <div class="line-top">
                <p class="name">{{ item.pacienteNombre }}</p>
                <StatusBadge :value="item.estado" />
              </div>
              <p class="meta">{{ motivoConsultaLabel(item.motivo, 'short') }} — {{ formatDate(item.fechaISO) }}</p>
              <p class="meta">Sala: {{ item.salaConsultorio || 'N/D' }}</p>
            </div>
            <div class="right-side">
              <span class="doctor">{{ item.medicoAsignado }}</span>
              <span class="time-pill">{{ timeOnly(item.fechaISO) }}</span>
            </div>
          </li>
        </ul>
        <p v-else class="empty-upcoming">No hay citas futuras en agenda.</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CalendarCheck2, CircleX, ClipboardPlus, Cross, HeartPulse, Syringe } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import MonthlyAppointmentsChart from '../components/charts/MonthlyAppointmentsChart.vue'
import ClinicIllustration from '../components/ui/ClinicIllustration.vue'
import StatCard from '../components/ui/StatCard.vue'
import StatusBadge from '../components/ui/StatusBadge.vue'
import { useClinicUiStore } from '../stores/ui'
import { formatClockNow, formatDateTimeSystem, formatTimeSystem } from '../domain/datetimeDisplay'
import { motivoConsultaLabel } from '../domain/motivoConsulta'
import { welcomeDashboardLine, welcomeKickerForRole } from '../domain/welcome'

const store = useClinicUiStore()
const currentTime = ref(formatClockNow())

/** Primer nombre para saludo; vacío si no hay usuario. */
const welcomeFirstName = computed(() => {
  const raw = store.currentUser?.nombre?.trim()
  if (!raw) return ''
  return raw.split(/\s+/)[0]
})

const welcomeKicker = computed(() => welcomeKickerForRole(store.currentRole))

const welcomeLine = computed(() =>
  welcomeDashboardLine({
    role: store.currentRole,
    firstName: welcomeFirstName.value,
    patientGenero: store.currentPatientRecord?.genero,
  }),
)

const welcomeRoleClass = computed(() => {
  const r = store.currentRole
  if (r === 'admin') return 'welcome-inline--admin'
  if (r === 'medico') return 'welcome-inline--medico'
  return 'welcome-inline--paciente'
})

const dashboardSubtitle = computed(() => {
  if (store.currentRole === 'admin') {
    return 'Supervisión de la operación: citas, equipo y parámetros del sistema.'
  }
  if (store.currentRole === 'medico') {
    return 'Tu jornada clínica: pacientes, agenda y coordinación del día.'
  }
  return 'Tu espacio para ver citas, avisos y el seguimiento de tu salud.'
})

const upcomingAppointments = computed(() =>
  store.roleVisibleAppointments
    .filter((item) => new Date(item.fechaISO).getTime() >= Date.now())
    .slice()
    .sort((a, b) => new Date(a.fechaISO).getTime() - new Date(b.fechaISO).getTime())
    .slice(0, 4),
)

let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => {
    currentTime.value = formatClockNow()
  }, 1000)
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})

const formatDate = (value: string) => formatDateTimeSystem(value)
const timeOnly = (value: string) => formatTimeSystem(value)
</script>

<style scoped>
.welcome-inline {
  margin: 0 0 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(58, 143, 183, 0.22);
}
.welcome-inline--admin {
  border-bottom-color: rgba(139, 90, 168, 0.35);
}
.welcome-inline--medico {
  border-bottom-color: rgba(46, 139, 120, 0.35);
}
.welcome-inline--paciente {
  border-bottom-color: rgba(58, 143, 183, 0.28);
}
.welcome-inline--admin .welcome-kicker {
  color: #6b4d86;
}
.welcome-inline--medico .welcome-kicker {
  color: #1f7a6a;
}
.welcome-kicker {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--primary);
}
.welcome-text {
  margin: 6px 0 0;
  font-size: 1.02rem;
  line-height: 1.45;
  color: var(--primary-dark);
  font-weight: 600;
  max-width: 52ch;
}

.dashboard-split {
  min-height: calc(100vh - 132px);
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
}

.top-half,
.bottom-half {
  min-height: 0;
  display: grid;
  gap: 12px;
}

.hero {
  padding: 22px;
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  align-items: center;
  gap: 14px;
  background:
    linear-gradient(125deg, rgba(217, 237, 247, 0.86), rgba(220, 247, 240, 0.84)),
    var(--bg-surface);
}
.medical-pattern {
  position: relative;
  overflow: hidden;
}
.medical-pattern::before {
  content: '';
  position: absolute;
  right: -80px;
  bottom: -60px;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(111, 208, 185, 0.22), transparent 65%);
}
.hero-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}
.hero-right {
  display: grid;
  gap: 10px;
}
.medical-icons {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.medical-icons span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.66);
  color: var(--primary-dark);
  font-size: 0.82rem;
  font-weight: 700;
}
.cta {
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 700;
}
.primary {
  color: #fff;
  background: linear-gradient(140deg, var(--primary), var(--secondary));
}
.secondary {
  color: var(--primary-dark);
  background: rgba(255, 255, 255, 0.8);
}
.pulse {
  justify-self: stretch;
  border-radius: 14px;
  padding: 6px 4px;
  background: transparent;
  border: 0;
  animation: floatCard 3.2s ease-in-out infinite;
}
.pulse-label {
  margin: 0;
  color: var(--primary-dark);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
}
.pulse-time {
  margin: 2px 0 0;
  font-size: clamp(1.9rem, 2.8vw, 2.5rem);
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  color: transparent;
  background: linear-gradient(115deg, #225f80, #3a8fb7 45%, #70bdb2);
  -webkit-background-clip: text;
  background-clip: text;
  text-shadow: 0 8px 18px rgba(34, 95, 128, 0.16);
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.upcoming {
  padding: 16px;
}
.upcoming-caption {
  margin: 6px 0 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}
.upcoming-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
h2 {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
}
.details-link {
  color: var(--primary-dark);
  font-weight: 700;
}
ul {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  background: var(--bg-soft);
  border-radius: 12px;
  padding: 10px 12px;
}
.line-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.name {
  margin: 0;
  font-weight: 700;
}
.meta {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 0.88rem;
}
.doctor {
  font-size: 0.85rem;
  color: var(--primary-dark);
  font-weight: 700;
}
.right-side {
  display: grid;
  justify-items: end;
  gap: 6px;
}
.time-pill {
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 0.74rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(120deg, var(--primary), var(--secondary));
}
.empty-upcoming {
  margin: 12px 0 0;
  text-align: center;
  color: var(--text-muted);
  font-weight: 600;
}
@keyframes floatCard {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
@media (max-width: 1000px) {
  .dashboard-split {
    min-height: auto;
    grid-template-rows: auto;
  }
  .hero {
    grid-template-columns: 1fr;
  }
  .stats {
    grid-template-columns: 1fr;
  }
}
</style>
