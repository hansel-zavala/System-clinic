<template>
  <section class="surface-card form-card">
    <header class="head">
      <div>
        <h3 class="form-title">Nueva consulta</h3>
        <p class="form-lead">Revisa el resumen antes de guardar.</p>
      </div>
      <span class="status-pill" :class="{ ready: canSubmit }">
        <Sparkles v-if="canSubmit" :size="14" aria-hidden="true" />
        <AlertCircle v-else :size="14" aria-hidden="true" />
        {{ canSubmit ? 'Listo para guardar' : 'Completa fecha y lugar' }}
      </span>
    </header>

    <div class="layout">
      <div class="form-main">
        <section class="block">
          <h4 class="block-title">
            <UserRound :size="18" aria-hidden="true" />
            Paciente y agenda
          </h4>
          <div class="form-grid">
            <label class="field">
              <span class="field-label">Paciente</span>
              <select v-model="form.pacienteId" class="input">
                <option v-for="patient in patients" :key="patient.id" :value="patient.id">
                  {{ store.patientDisplayName(patient) }}
                </option>
              </select>
            </label>
            <label class="field">
              <span class="field-label" :id="fechaHoraLabelId">Fecha y hora</span>
              <DateTimeAmPmPicker v-model="form.fechaISO" :label-id="fechaHoraLabelId" />
            </label>
            <label class="field">
              <span class="field-label">Duración</span>
              <select v-model.number="form.duracionMin" class="input">
                <option v-for="d in duracionesOpciones" :key="d" :value="d">{{ duracionLabel(d) }}</option>
              </select>
            </label>
            <label class="field">
              <span class="field-label">Motivo de la consulta</span>
              <select v-model="form.motivo" class="input">
                <option v-for="m in motivosActivosList" :key="m.id" :value="m.codigo">{{ m.nombreLargo }}</option>
              </select>
            </label>
          </div>
        </section>

        <section class="block">
          <h4 class="block-title">
            <Stethoscope :size="18" aria-hidden="true" />
            Equipo y ubicación
          </h4>
          <div class="form-grid">
            <label class="field">
              <span class="field-label">Médico asignado</span>
              <select v-model="form.medicoUserId" class="input">
                <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
                  {{ doctor.nombre }}{{ doctor.especialidad ? ` — ${doctor.especialidad}` : '' }}
                </option>
              </select>
            </label>
            <label class="field">
              <span class="field-label">Consultorio / sala</span>
              <select v-model="form.consultorioId" class="input">
                <option v-for="room in consultoriosActivosList" :key="room.id" :value="room.id">
                  {{ room.codigo }}{{ room.nombre && room.nombre !== room.codigo ? ` — ${room.nombre}` : '' }}
                </option>
              </select>
            </label>
          </div>
        </section>

        <section class="block">
          <h4 class="block-title">
            <FileText :size="18" aria-hidden="true" />
            Notas
          </h4>
          <label class="field field-full">
            <span class="field-label">Observaciones (opcional)</span>
            <textarea
              v-model="form.notas"
              class="input textarea"
              rows="3"
              placeholder="Motivo breve, requisitos previos o indicaciones para recepción."
            />
          </label>
        </section>

        <div class="actions">
          <button type="button" class="btn-primary" :disabled="!canSubmit" @click="submitForm">
            <CalendarPlus :size="18" aria-hidden="true" />
            Guardar cita
          </button>
          <button type="button" class="btn-ghost" @click="resetForm">Limpiar formulario</button>
        </div>
      </div>

      <aside class="preview">
        <div class="preview-head">
          <div class="preview-icon" aria-hidden="true">
            <ClipboardList :size="22" />
          </div>
          <div>
            <h4>Resumen</h4>
            <p class="preview-sub">Vista previa de lo que quedará registrado</p>
          </div>
        </div>

        <dl class="preview-dl">
          <div>
            <dt>Paciente</dt>
            <dd>{{ selectedPatientName }}</dd>
          </div>
          <div>
            <dt>Médico</dt>
            <dd>{{ selectedDoctorName }}</dd>
          </div>
          <div>
            <dt>Fecha y hora</dt>
            <dd>{{ formattedDate }}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{{ form.duracionMin }} min</dd>
          </div>
          <div>
            <dt>Motivo</dt>
            <dd>{{ motivoLabel }}</dd>
          </div>
          <div>
            <dt>Estado al guardar</dt>
            <dd class="preview-estado">
              <StatusBadge value="pendiente" />
              <span class="estado-hint">Se asigna automáticamente; podrás confirmarla luego.</span>
            </dd>
          </div>
          <div>
            <dt>Consultorio</dt>
            <dd>{{ selectedConsultorioLabel }}</dd>
          </div>
        </dl>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  AlertCircle,
  CalendarPlus,
  ClipboardList,
  FileText,
  Sparkles,
  Stethoscope,
  UserRound,
} from 'lucide-vue-next'
import { computed, reactive, watch } from 'vue'
import type { CreateAppointmentPayload, Patient, UserProfile } from '../../domain/types'
import { formatDateTimeLongEs } from '../../domain/datetimeDisplay'
import { motivoConsultaLabel } from '../../domain/motivoConsulta'
import StatusBadge from '../ui/StatusBadge.vue'
import DateTimeAmPmPicker from '../ui/DateTimeAmPmPicker.vue'
import { useClinicUiStore } from '../../stores/ui'

const fechaHoraLabelId = 'field-fecha-hora'

const store = useClinicUiStore()

const props = defineProps<{
  patients: Patient[]
  doctors: UserProfile[]
}>()

const emit = defineEmits<{
  submit: [payload: CreateAppointmentPayload]
}>()

const defaultConsultorioId = () => store.consultoriosActivos?.[0]?.id ?? ''

/** Lista segura (Pinia/HMR puede dejar getters sin definir un instante). */
const consultoriosActivosList = computed(() => store.consultoriosActivos ?? [])

const motivosActivosList = computed(() => store.motivosConsultaActivos ?? [])

const firstDuracionPermitida = (): number => {
  const opts = store.duracionesOpcionActivas ?? []
  return opts[0]?.minutos ?? 30
}

const firstMotivoCodigo = (): string => store.motivosConsultaActivos?.[0]?.codigo ?? 'chequeo'

const duracionesOpciones = computed(() => (store.duracionesOpcionActivas ?? []).map((d) => d.minutos))

const duracionLabel = (min: number) => {
  if (min === 60) return '1 hora'
  return `${min} minutos`
}

const defaultForm = () => ({
  pacienteId: props.patients[0]?.id ?? '',
  fechaISO: '',
  duracionMin: firstDuracionPermitida(),
  motivo: firstMotivoCodigo(),
  medicoUserId: props.doctors[0]?.id ?? '',
  consultorioId: defaultConsultorioId(),
  notas: '',
})

const form = reactive(defaultForm())

watch(
  duracionesOpciones,
  (opts) => {
    if (!opts.length) return
    if (!opts.includes(form.duracionMin)) form.duracionMin = opts[0]!
  },
  { immediate: true },
)

const motivoLabel = computed(() => motivoConsultaLabel(form.motivo, 'long'))

const selectedPatientName = computed(() => {
  const p = props.patients.find((item) => item.id === form.pacienteId)
  return p ? store.patientDisplayName(p) : 'Selecciona un paciente'
})
const selectedDoctorName = computed(
  () => props.doctors.find((item) => item.id === form.medicoUserId)?.nombre ?? 'Selecciona un médico',
)
const selectedConsultorioLabel = computed(() => {
  const c = consultoriosActivosList.value.find((item) => item.id === form.consultorioId)
  return c ? `${c.codigo}${c.nombre && c.nombre !== c.codigo ? ` (${c.nombre})` : ''}` : '—'
})
const canSubmit = computed(() => Boolean(form.pacienteId && form.medicoUserId && form.fechaISO && form.consultorioId))
const formattedDate = computed(() =>
  form.fechaISO ? formatDateTimeLongEs(form.fechaISO) : 'Indica fecha y hora',
)

const submitForm = () => {
  if (!canSubmit.value) return
  emit('submit', {
    pacienteId: form.pacienteId,
    fechaISO: new Date(form.fechaISO).toISOString(),
    duracionMin: form.duracionMin,
    motivo: form.motivo,
    medicoUserId: form.medicoUserId,
    consultorioId: form.consultorioId,
    notas: form.notas,
  })
  Object.assign(form, defaultForm())
}

const resetForm = () => Object.assign(form, defaultForm())
</script>

<style scoped>
.form-card {
  padding: 0;
  overflow: hidden;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 20px;
  background: linear-gradient(140deg, rgba(223, 240, 248, 0.55), rgba(255, 255, 255, 0.96));
  border-bottom: 1px solid var(--border);
}

.form-title {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.45rem;
  font-weight: 600;
  color: var(--primary-dark);
}

.form-lead {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.45;
  max-width: 52ch;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--warning);
  background: rgba(200, 155, 60, 0.18);
  border: 1px solid rgba(200, 155, 60, 0.28);
}

.status-pill.ready {
  color: var(--success);
  background: rgba(47, 138, 105, 0.1);
  border-color: rgba(47, 138, 105, 0.25);
}

.layout {
  display: grid;
  grid-template-columns: 1fr minmax(0, 280px);
  gap: 0;
}

.form-main {
  padding: 18px 20px 22px;
  display: grid;
  gap: 18px;
}

.block {
  display: grid;
  gap: 12px;
}

.block-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary-dark);
}

.block-title svg {
  color: var(--primary);
  opacity: 0.9;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: grid;
  gap: 5px;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-main);
}

.field-full {
  grid-column: 1 / -1;
}

.input {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  font-size: 0.92rem;
  background: rgba(255, 255, 255, 0.95);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input:hover:not(:disabled) {
  border-color: rgba(58, 143, 183, 0.35);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(58, 143, 183, 0.2);
}

.textarea {
  min-height: 88px;
  resize: vertical;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 4px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 11px;
  padding: 11px 18px;
  font: inherit;
  font-weight: 700;
  font-size: 0.95rem;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(125deg, var(--primary), #2d7a9e);
  box-shadow: 0 6px 18px rgba(58, 143, 183, 0.25);
  transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(58, 143, 183, 0.28);
}

.btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-ghost {
  border: 1px solid var(--border);
  border-radius: 11px;
  padding: 11px 16px;
  font: inherit;
  font-weight: 700;
  color: var(--primary-dark);
  background: rgba(239, 246, 250, 0.95);
  cursor: pointer;
}

.btn-ghost:hover {
  background: #e8f2f6;
}

.preview {
  border-left: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(240, 248, 252, 0.9), rgba(255, 255, 255, 0.88));
  padding: 18px 16px 20px;
  align-self: stretch;
}

.preview-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.preview-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(58, 143, 183, 0.12);
  color: var(--primary-dark);
}

.preview h4 {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.15rem;
  color: var(--primary-dark);
}

.preview-sub {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.preview-dl {
  margin: 0;
  display: grid;
  gap: 10px;
}

.preview-dl > div {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(58, 143, 183, 0.12);
  background: rgba(255, 255, 255, 0.75);
}

.preview-dl dt {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.preview-dl dd {
  margin: 4px 0 0;
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.35;
}

.preview-estado {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.estado-hint {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted);
  line-height: 1.35;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .preview {
    border-left: none;
    border-top: 1px solid var(--border);
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
