<template>
  <section class="calendar-page">
    <PageHero
      pill="Agenda"
      title="Calendario mensual/semanal"
      subtitle="Agenda compacta, en español e interactiva."
    >
      <template #actions>
        <RouterLink v-if="store.canScheduleAppointments" to="/app/agendar-cita" class="back-link"
          >Agendar cita</RouterLink
        >
      </template>
    </PageHero>

    <div class="calendar-layout">
      <article class="surface-card calendar-card">
        <FullCalendar :options="calendarOptions" />
      </article>

      <aside class="surface-card side-panel">
        <h3>{{ panelTitle }}</h3>
        <p class="hint">{{ panelHint }}</p>
        <ul v-if="panelEvents.length" class="event-list">
          <li v-for="event in panelEvents" :key="event.id">
            <p class="event-name">{{ event.title }}</p>
            <p class="event-meta">{{ formatRange(event.start, event.end) }}</p>
          </li>
        </ul>
        <p v-else class="empty">Selecciona un día o cita para ver detalles.</p>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventContentArg } from '@fullcalendar/core'
import esLocale from '@fullcalendar/core/locales/es'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageHero from '../components/layout/PageHero.vue'
import { useClinicUiStore } from '../stores/ui'
import { formatCalendarRange, formatTimeSystem, formatYyyyMmDdLabel } from '../domain/datetimeDisplay'

const store = useClinicUiStore()

const selectedDate = ref<string | null>(null)
const selectedEventId = ref<string | null>(null)

const mappedEvents = computed(() =>
  store.roleVisibleAppointments.map((appointment) => ({
    id: appointment.id,
    title: `${appointment.pacienteNombre} - ${appointment.motivo}`,
    start: appointment.fechaISO,
    end: new Date(new Date(appointment.fechaISO).getTime() + appointment.duracionMin * 60000).toISOString(),
    allDay: false,
  })),
)

const byStartAsc = (a: { start: string }, b: { start: string }) =>
  new Date(a.start).getTime() - new Date(b.start).getTime()

const panelEvents = computed(() => {
  const all = [...mappedEvents.value].sort(byStartAsc)
  if (selectedEventId.value) {
    return all.filter((item) => item.id === selectedEventId.value)
  }
  if (selectedDate.value) {
    return all.filter((item) => item.start.slice(0, 10) === selectedDate.value)
  }
  return all.slice(0, 5)
})

const panelTitle = computed(() => {
  if (selectedEventId.value) return 'Detalle de cita seleccionada'
  if (selectedDate.value) return `Citas del ${formatYyyyMmDdLabel(selectedDate.value)}`
  return 'Próximas citas'
})

const panelHint = computed(() =>
  selectedDate.value || selectedEventId.value
    ? 'Puedes cambiar la selección directamente sobre el calendario.'
    : 'Haz click en una fecha o evento para filtrar.',
)

const formatRange = (startIso: string, endIso: string) => formatCalendarRange(startIso, endIso)

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  locale: esLocale,
  slotLabelFormat: {
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    meridiem: 'short' as const,
    hour12: true,
  },
  eventTimeFormat: {
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    meridiem: 'short' as const,
    hour12: true,
  },
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
  },
  initialView: 'dayGridMonth',
  height: 'auto',
  selectable: true,
  navLinks: true,
  eventDisplay: 'block',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek',
  },
  events: mappedEvents.value,
  dateClick: (info: { dateStr: string }) => {
    selectedEventId.value = null
    selectedDate.value = info.dateStr
  },
  eventClick: (info: { event: { id: string; startStr: string } }) => {
    selectedDate.value = info.event.startStr.slice(0, 10)
    selectedEventId.value = info.event.id
  },
  eventContent: (arg: EventContentArg) => {
    const start = arg.event.start
    if (!start) return undefined
    const wrap = document.createElement('div')
    wrap.className = 'fc-event-main-frame'
    const timeEl = document.createElement('span')
    timeEl.className = 'fc-event-time'
    timeEl.textContent = formatTimeSystem(start.toISOString())
    const titleEl = document.createElement('span')
    titleEl.className = 'fc-event-title'
    titleEl.textContent = ` ${arg.event.title}`
    wrap.appendChild(timeEl)
    wrap.appendChild(titleEl)
    return { domNodes: [wrap] }
  },
}))
</script>

<style scoped>
.calendar-page {
  display: grid;
  gap: 12px;
}
.calendar-layout {
  margin-top: 0;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 10px;
}
.calendar-card {
  padding: 10px 12px;
}
.side-panel {
  padding: 10px;
  align-self: start;
}
h3 {
  margin: 0;
  font-size: 1rem;
}
.hint {
  margin: 4px 0 10px;
  color: var(--text-muted);
  font-size: 0.82rem;
}
.event-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.event-list li {
  border-radius: 8px;
  padding: 8px;
  background: rgba(122, 181, 210, 0.14);
}
.event-name {
  margin: 0;
  font-weight: 700;
  font-size: 0.86rem;
}
.event-meta {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 0.78rem;
}
.empty {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}
:deep(.fc) {
  font-size: 0.84rem;
}
:deep(.fc .fc-toolbar.fc-header-toolbar) {
  margin-bottom: 0.5rem;
}
:deep(.fc .fc-button) {
  border-radius: 8px;
}
:deep(.fc .fc-daygrid-day-number) {
  font-size: 0.82rem;
}
:deep(.fc .fc-event) {
  border-radius: 6px;
  border: 0;
  padding: 1px 4px;
  background: linear-gradient(120deg, var(--primary), var(--secondary));
}
@media (max-width: 1050px) {
  .calendar-layout {
    grid-template-columns: 1fr;
  }
}
</style>
