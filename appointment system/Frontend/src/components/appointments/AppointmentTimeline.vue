<template>
  <section class="surface-card wrapper">
    <div class="head">
      <div>
        <h3>Historial cronológico</h3>
        <p class="hint">Pulsa una cita para ver el expediente y descargar el PDF.</p>
      </div>
      <p class="count">
        <template v-if="totalMatching != null && totalMatching !== appointments.length">
          {{ appointments.length }} en esta página · {{ totalMatching }} en total
        </template>
        <template v-else> {{ appointments.length }} registro(s) </template>
      </p>
    </div>
    <ol v-if="appointments.length">
      <li
        v-for="item in appointments"
        :key="item.id"
        class="timeline-item"
        role="button"
        tabindex="0"
        @click="emit('openDetail', item)"
        @keydown.enter.prevent="emit('openDetail', item)"
        @keydown.space.prevent="emit('openDetail', item)"
      >
        <div class="line-head">
          <p class="title">{{ item.pacienteNombre }} - {{ item.motivo }}</p>
          <StatusBadge :value="item.estado" />
        </div>
        <p class="meta">{{ formatDate(item.fechaISO) }} | Medico: {{ item.medicoAsignado }}</p>
        <p class="meta">Sala: {{ item.salaConsultorio || 'No definida' }}</p>
        <p class="notes">{{ item.notas || 'Sin notas de consulta.' }}</p>
      </li>
    </ol>
    <p v-else class="empty">No hay citas en historial para los filtros seleccionados.</p>
  </section>
</template>

<script setup lang="ts">
import { formatDateTimeSystem } from '../../domain/datetimeDisplay'
import type { AppointmentView } from '../../domain/types'
import StatusBadge from '../ui/StatusBadge.vue'

withDefaults(
  defineProps<{
    appointments: AppointmentView[]
    /** Total con filtros (paginación); si no se pasa, solo se muestra el conteo de la lista */
    totalMatching?: number
  }>(),
  { totalMatching: undefined },
)

const emit = defineEmits<{
  openDetail: [item: AppointmentView]
}>()

const formatDate = (value: string) => formatDateTimeSystem(value)
</script>

<style scoped>
.wrapper {
  padding: 14px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.head > div:first-child {
  min-width: 0;
}
h3 {
  margin: 0;
}
.hint {
  margin: 6px 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 500;
}
.count {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}
ol {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
.timeline-item {
  border-left: 3px solid var(--secondary);
  background: rgba(237, 247, 248, 0.68);
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease;
}
.timeline-item:hover {
  background: rgba(220, 240, 245, 0.88);
  box-shadow: 0 4px 14px rgba(42, 87, 115, 0.1);
}
.timeline-item:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.timeline-item:active {
  transform: scale(0.998);
}
.line-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.title {
  margin: 0;
  font-weight: 700;
}
.meta {
  margin: 3px 0 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}
.notes {
  margin: 8px 0 0;
  font-size: 0.84rem;
  color: var(--text-base);
}
.empty {
  margin: 12px 0 0;
  text-align: center;
  color: var(--text-muted);
  font-weight: 600;
}
</style>
