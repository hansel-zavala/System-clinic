<template>
  <AppModal
    :open="open && !!patient"
    title-id="pat-modal-title"
    size="lg"
    stack-body
    @close="emit('close')"
  >
    <template #header>
      <template v-if="patient">
        <p class="kicker">Expediente clínico</p>
        <h2 id="pat-modal-title">{{ displayName }}</h2>
        <p class="sub">{{ displayEmail }}</p>
      </template>
    </template>

    <template v-if="patient">
      <section class="grid-mini">
        <div><span class="lbl">Edad</span><span class="val">{{ edadTexto }}</span></div>
        <div><span class="lbl">Género</span><span class="val">{{ patient.genero }}</span></div>
        <div><span class="lbl">Teléfono</span><span class="val">{{ formatPhoneDisplay(patient.telefono) }}</span></div>
        <div><span class="lbl">Tipo de sangre</span><span class="val">{{ patient.tipoSangre || 'N/D' }}</span></div>
      </section>

      <section class="block">
        <h3><MapPin :size="16" /> Dirección</h3>
        <p>{{ patient.direccion.calle }}, {{ patient.direccion.ciudad }}</p>
      </section>

      <section class="block">
        <h3><AlertCircle :size="16" /> Alergias</h3>
        <p>{{ store.patientAllergiesLine(patient) || 'Sin registro' }}</p>
      </section>

      <section class="block">
        <h3><Pill :size="16" /> Medicamentos</h3>
        <p>{{ store.patientMedicationsLine(patient) || 'Sin registro' }}</p>
      </section>

      <section class="block">
        <h3><FileText :size="16" /> Notas médicas</h3>
        <p>{{ patient.notasMedico || 'Sin notas.' }}</p>
      </section>

      <section v-if="citasPreview.length" class="block block-muted">
        <h3><Calendar :size="16" /> Citas recientes</h3>
        <ul>
          <li v-for="(line, idx) in citasPreview" :key="idx">{{ line }}</li>
        </ul>
      </section>
    </template>

    <template #footer>
      <button type="button" class="btn-secondary" @click="emit('close')">Cerrar</button>
      <button type="button" class="btn-primary" @click="onPdf">
        <FileDown :size="18" />
        Descargar PDF del expediente
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { AlertCircle, Calendar, FileDown, FileText, MapPin, Pill } from 'lucide-vue-next'
import { computed } from 'vue'
import AppModal from '../ui/AppModal.vue'
import { formatDateTimeSystem } from '../../domain/datetimeDisplay'
import { enrichAppointment } from '../../domain/clinicJoins'
import { downloadPatientClinicalPdf } from '../../domain/pdf/clinicPdf'
import { patientAge } from '../../domain/ageFromBirth'
import { formatPhoneDisplay } from '../../domain/phoneCr'
import type { Patient } from '../../domain/types'
import { useClinicUiStore } from '../../stores/ui'

const props = defineProps<{
  open: boolean
  patient: Patient | null
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useClinicUiStore()

const displayName = computed(() => (props.patient ? store.patientDisplayName(props.patient) : ''))
const displayEmail = computed(() => (props.patient ? store.patientDisplayEmail(props.patient) : ''))
const edadTexto = computed(() => (props.patient ? `${patientAge(props.patient)} años` : ''))

const citasPreview = computed(() => {
  if (!props.patient) return []
  return store.appointments
    .filter((a) => a.pacienteId === props.patient!.id)
    .slice()
    .sort((a, b) => new Date(b.fechaISO).getTime() - new Date(a.fechaISO).getTime())
    .slice(0, 8)
    .map((a) => {
      const v = enrichAppointment(a, store.users, store.patients, store.consultorios)
      return `${formatDateTimeSystem(v.fechaISO)} · ${v.motivo} · ${v.estado}`
    })
})

const citasResumenPdf = computed(() => {
  if (!props.patient) return []
  return store.appointments
    .filter((a) => a.pacienteId === props.patient!.id)
    .slice()
    .sort((a, b) => new Date(b.fechaISO).getTime() - new Date(a.fechaISO).getTime())
    .slice(0, 40)
    .map((a) => {
      const v = enrichAppointment(a, store.users, store.patients, store.consultorios)
      return `${formatDateTimeSystem(v.fechaISO)} — ${v.motivo} — ${v.estado} — ${v.medicoAsignado}`
    })
})

const onPdf = () => {
  const p = props.patient
  if (!p) return
  const esMedico = store.currentRole === 'medico'
  const firmaUrl = store.currentUser.firmaDigital
  const firmaOk = esMedico && typeof firmaUrl === 'string' && firmaUrl.startsWith('data:image')
  downloadPatientClinicalPdf(
    {
      nombre: store.patientDisplayName(p),
      correo: store.patientDisplayEmail(p),
      telefono: formatPhoneDisplay(p.telefono),
      edadTexto: `${patientAge(p)} años`,
      genero: p.genero,
      fechaNacimiento: p.fechaNacimiento,
      fechaRegistro: p.fechaRegistro,
      direccion: `${p.direccion.calle}, ${p.direccion.ciudad}`.trim(),
      tipoSangre: p.tipoSangre,
      alergias: store.patientAllergiesLine(p) || '',
      medicamentos: store.patientMedicationsLine(p) || '',
      notasMedico: p.notasMedico || '',
      citasResumen: citasResumenPdf.value,
    },
    {
      firmaDigital: firmaOk ? firmaUrl : undefined,
      firmanteNombre: firmaOk ? store.currentUser.nombre : undefined,
    },
  )
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

.sub {
  margin: 4px 0 0;
  font-size: 0.86rem;
  color: var(--text-muted);
}

.grid-mini {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.grid-mini > div {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(248, 252, 255, 0.9);
  display: grid;
  gap: 4px;
}

.lbl {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.val {
  font-weight: 600;
  font-size: 0.9rem;
}

.block h3 {
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.block p,
.block li {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--text-main);
}

.block {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.85);
}

.block-muted {
  background: rgba(240, 247, 252, 0.75);
}

.block ul {
  margin: 0;
  padding-left: 18px;
}

.block li {
  margin-bottom: 4px;
}

@media (max-width: 480px) {
  .grid-mini {
    grid-template-columns: 1fr;
  }
}
</style>
