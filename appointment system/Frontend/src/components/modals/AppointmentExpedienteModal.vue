<template>
  <AppModal
    :open="open && !!appointment"
    title-id="apt-modal-title"
    @close="emit('close')"
  >
    <template #header>
      <template v-if="appointment">
        <p class="kicker">Expediente de cita</p>
        <h2 id="apt-modal-title">{{ appointment.pacienteNombre }}</h2>
        <div class="chips">
          <span class="chip">{{ motivoLabel(appointment.motivo) }}</span>
          <StatusBadge :value="appointment.estado" />
        </div>
      </template>
    </template>

    <template v-if="appointment">
      <dl class="detail-list">
        <div><dt>Fecha y hora</dt><dd>{{ formatFull(appointment.fechaISO) }}</dd></div>
        <div><dt>Duración</dt><dd>{{ appointment.duracionMin }} min</dd></div>
        <div><dt>Médico</dt><dd>{{ appointment.medicoAsignado }}</dd></div>
        <div><dt>Consultorio</dt><dd>{{ appointment.salaConsultorio || appointment.consultorioNombre || 'No definido' }}</dd></div>
      </dl>
      <section class="notes">
        <h3><FileText :size="18" /> Notas</h3>
        <p>{{ appointment.notas || 'Sin notas registradas.' }}</p>
      </section>
    </template>

    <template #footer>
      <button type="button" class="btn-secondary" @click="emit('close')">Cerrar</button>
      <button type="button" class="btn-primary" @click="onPdf">
        <FileDown :size="18" />
        Descargar PDF
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { FileDown, FileText } from 'lucide-vue-next'
import AppModal from '../ui/AppModal.vue'
import { formatDateTimeLongEs } from '../../domain/datetimeDisplay'
import { motivoConsultaLabel } from '../../domain/motivoConsulta'
import { downloadAppointmentExpedientePdf } from '../../domain/pdf/clinicPdf'
import type { AppointmentView } from '../../domain/types'
import { useClinicUiStore } from '../../stores/ui'
import StatusBadge from '../ui/StatusBadge.vue'

const store = useClinicUiStore()

const props = defineProps<{
  open: boolean
  appointment: AppointmentView | null
}>()

const emit = defineEmits<{
  close: []
}>()

const motivoLabel = (m: AppointmentView['motivo']) => motivoConsultaLabel(m, 'short')
const formatFull = (iso: string) => formatDateTimeLongEs(iso)

const onPdf = () => {
  if (!props.appointment) return
  const esMedico = store.currentRole === 'medico'
  const firmaUrl = store.currentUser.firmaDigital
  const firmaOk = esMedico && typeof firmaUrl === 'string' && firmaUrl.startsWith('data:image')
  downloadAppointmentExpedientePdf(props.appointment, {
    firmaDigital: firmaOk ? firmaUrl : undefined,
    firmanteNombre: firmaOk ? store.currentUser.nombre : undefined,
  })
}
</script>

<style scoped>
.kicker {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

h2 {
  margin: 6px 0 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.45rem;
  color: var(--primary-dark);
}

.chips {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  background: rgba(112, 189, 178, 0.22);
  color: #1d5c54;
  border: 1px solid rgba(112, 189, 178, 0.35);
}

.detail-list {
  margin: 0;
  display: grid;
  gap: 10px;
}

.detail-list > div {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(248, 252, 255, 0.9);
}

.detail-list dt {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.detail-list dd {
  margin: 0;
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--text-main);
}

.notes {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(240, 249, 246, 0.5);
}

.notes h3 {
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.notes p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-main);
}
</style>
