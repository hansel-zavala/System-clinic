<template>
  <section class="surface-card wrapper">
    <div class="toolbar">
      <div class="filters">
        <input v-model="searchModel" placeholder="Buscar por nombre, edad o teléfono" />
        <select v-model="genderModel">
          <option value="Todos">Todos los géneros</option>
          <option value="F">Femenino</option>
          <option value="M">Masculino</option>
          <option value="Otro">Otro</option>
        </select>
        <button class="clear-btn" type="button" :disabled="!hasFilters" @click="clearFilters">Limpiar</button>
      </div>
      <p class="row-hint">Pulsa una fila para ver el expediente clínico y el PDF.</p>
      <p class="count">
        <template v-if="pageStart != null && pageEnd != null && totalVisible > 0">
          Mostrando {{ pageStart }}–{{ pageEnd }} de {{ totalVisible }} paciente(s)
        </template>
        <template v-else> Mostrando {{ totalVisible }} paciente(s) </template>
      </p>
    </div>

    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Edad</th>
            <th>Contacto</th>
            <th>Género</th>
            <th>Ubicación</th>
            <th>Ficha clínica</th>
            <th v-if="canViewMedicalNotes">Notas médicas</th>
            <th v-if="canEdit">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!patients.length">
            <td :colspan="6 + (canViewMedicalNotes ? 1 : 0) + (canEdit ? 1 : 0)" class="empty-cell">
              No se encontraron pacientes con los filtros actuales.
            </td>
          </tr>
          <tr
            v-for="patient in patients"
            :key="patient.id"
            class="row-clickable"
            @click="emit('openDetail', patient)"
          >
            <td>
              <p class="name">{{ store.patientDisplayName(patient) }}</p>
              <p class="meta">{{ store.patientDisplayEmail(patient) }}</p>
            </td>
            <td>{{ patientAge(patient) }}</td>
            <td>
              <p class="name">{{ formatPhoneDisplay(patient.telefono) }}</p>
              <p class="meta">{{ store.patientDisplayEmail(patient) }}</p>
            </td>
            <td><span class="gender-pill">{{ patient.genero }}</span></td>
            <td>
              <p class="name">{{ patient.direccion.ciudad || 'Sin ciudad' }}</p>
              <p class="meta">{{ patient.direccion.calle || 'Sin calle' }}</p>
            </td>
            <td>
              <p class="name">Sangre: {{ patient.tipoSangre || 'N/D' }}</p>
              <p class="meta">Alergias: {{ store.patientAllergiesLine(patient) || 'Sin registro' }}</p>
              <p class="meta">Medicamentos: {{ store.patientMedicationsLine(patient) || 'Sin registro' }}</p>
            </td>
            <td v-if="canViewMedicalNotes">
              <p class="meta">{{ patient.notasMedico || 'Sin notas médicas' }}</p>
            </td>
            <td v-if="canEdit">
              <button class="edit-btn" type="button" @click.stop="openEditor(patient)">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="editingId" class="editor-backdrop" @click.self="closeEditor">
      <article class="editor surface-card">
        <h3>Editar paciente</h3>
        <div class="editor-grid">
          <label>
            Nombre
            <input v-model="draft.nombre" />
          </label>
          <label>
            Fecha de nacimiento
            <input v-model="draft.fechaNacimiento" type="date" :max="maxBirthDate" />
            <span v-if="draft.fechaNacimiento" class="edad-mini">Edad: {{ edadDraft }} años</span>
          </label>
          <label>
            Teléfono (8 dígitos)
            <PhoneInputCr v-model="draft.telefono" />
          </label>
          <label>
            Correo
            <input :value="draft.email" type="email" readonly class="input-readonly" title="El correo no se puede modificar" />
          </label>
          <label>
            Género
            <select v-model="draft.genero">
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
              <option value="Otro">Otro</option>
            </select>
          </label>
          <label>
            Ciudad
            <input v-model="draft.ciudad" />
          </label>
          <label>
            Calle
            <input v-model="draft.calle" />
          </label>
          <label>
            Tipo de sangre
            <select v-model="draft.tipoSangre">
              <option value="">Seleccionar…</option>
              <option v-for="bt in BLOOD_TYPES" :key="bt" :value="bt">{{ bt }}</option>
            </select>
          </label>
          <label class="full">
            Alergias
            <input v-model="draft.alergias" />
          </label>
          <label class="full">
            Medicamentos habituales
            <input v-model="draft.medicamentosHabituales" />
          </label>
          <label class="full">
            Notas médicas
            <textarea v-model="draft.notasMedico" rows="3" />
          </label>
        </div>
        <div class="editor-actions">
          <button type="button" class="ghost" @click="closeEditor">Cancelar</button>
          <button type="button" class="solid" @click="saveEdit">Guardar cambios</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import PhoneInputCr from '../ui/PhoneInputCr.vue'
import { ageFromBirthDate, patientAge } from '../../domain/ageFromBirth'
import { BLOOD_TYPES } from '../../domain/bloodTypes'
import { formatPhoneDisplay, isCompletePhoneCr, parsePhoneDigits } from '../../domain/phoneCr'
import type { Patient } from '../../domain/types'
import { computed, reactive, ref } from 'vue'
import { useClinicUiStore } from '../../stores/ui'

const store = useClinicUiStore()

const searchModel = defineModel<string>('search', { required: true })
const genderModel = defineModel<'Todos' | 'F' | 'M' | 'Otro'>('gender', { required: true })

const props = defineProps<{
  patients: Patient[]
  totalVisible: number
  /** Índices 1-based de la página actual (paginación) */
  pageStart?: number
  pageEnd?: number
  canEdit: boolean
  canViewMedicalNotes: boolean
}>()
const emit = defineEmits<{
  openDetail: [patient: Patient]
  editPatient: [
    payload: {
      patientId: string
      userPatch: { nombre: string }
      patientPatch: Partial<
        Pick<Patient, 'telefono' | 'genero' | 'tipoSangre' | 'notasMedico' | 'fechaNacimiento'>
      > & { direccion?: Partial<Patient['direccion']> }
      allergiesText: string
      medicationsText: string
    },
  ]
}>()
const editingId = ref<string | null>(null)
const draft = reactive({
  nombre: '',
  fechaNacimiento: '',
  telefono: '',
  genero: 'F' as Patient['genero'],
  email: '',
  ciudad: '',
  calle: '',
  tipoSangre: '',
  alergias: '',
  medicamentosHabituales: '',
  notasMedico: '',
})
const maxBirthDate = computed(() => new Date().toISOString().slice(0, 10))
const edadDraft = computed(() => (draft.fechaNacimiento ? ageFromBirthDate(draft.fechaNacimiento) : null))

const hasFilters = computed(() => searchModel.value.trim().length > 0 || genderModel.value !== 'Todos')
const clearFilters = () => {
  searchModel.value = ''
  genderModel.value = 'Todos'
}
const openEditor = (patient: Patient) => {
  if (!props.canEdit) return
  editingId.value = patient.id
  draft.nombre = store.patientDisplayName(patient)
  draft.fechaNacimiento = patient.fechaNacimiento ?? ''
  draft.telefono = parsePhoneDigits(patient.telefono)
  draft.genero = patient.genero
  draft.email = store.patientDisplayEmail(patient)
  draft.ciudad = patient.direccion.ciudad
  draft.calle = patient.direccion.calle
  draft.tipoSangre = patient.tipoSangre
  draft.alergias = store.patientAllergiesLine(patient)
  draft.medicamentosHabituales = store.patientMedicationsLine(patient)
  draft.notasMedico = patient.notasMedico
}
const closeEditor = () => {
  editingId.value = null
}
const saveEdit = () => {
  if (!editingId.value) return
  if (!draft.nombre.trim()) {
    window.alert('El nombre es obligatorio.')
    return
  }
  if (!isCompletePhoneCr(draft.telefono)) {
    window.alert('Indica un teléfono válido de 8 dígitos (0000-0000).')
    return
  }
  if (!draft.fechaNacimiento) {
    window.alert('Indica la fecha de nacimiento.')
    return
  }
  emit('editPatient', {
    patientId: editingId.value,
    userPatch: {
      nombre: draft.nombre.trim(),
    },
    patientPatch: {
      fechaNacimiento: draft.fechaNacimiento,
      telefono: parsePhoneDigits(draft.telefono),
      genero: draft.genero,
      tipoSangre: draft.tipoSangre.trim(),
      notasMedico: draft.notasMedico.trim(),
      direccion: {
        ciudad: draft.ciudad.trim(),
        calle: draft.calle.trim(),
      },
    },
    allergiesText: draft.alergias.trim(),
    medicationsText: draft.medicamentosHabituales.trim(),
  })
  closeEditor()
}
</script>

<style scoped>
.wrapper {
  padding: 12px;
}
.toolbar {
  display: grid;
  gap: 8px;
  margin-bottom: 10px;
}
.row-hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
}
.filters {
  display: flex;
  gap: 8px;
}
input,
select,
textarea {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  font: inherit;
  background: white;
}
input {
  min-width: 260px;
  flex: 1;
}
.clear-btn {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  font: inherit;
  font-weight: 700;
  background: rgba(239, 246, 250, 0.9);
  color: var(--primary-dark);
  cursor: pointer;
}
.clear-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.count {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}
.table-scroll {
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}
th,
td {
  text-align: left;
  padding: 9px 10px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}
th {
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.76rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: rgba(240, 249, 250, 0.92);
  position: sticky;
  top: 0;
  z-index: 1;
}
tbody tr:nth-child(even) {
  background: rgba(245, 250, 252, 0.44);
}
.row-clickable {
  cursor: pointer;
  transition: background 0.12s ease;
}
.row-clickable:hover {
  background: rgba(210, 235, 245, 0.65) !important;
}
.row-clickable:active {
  filter: brightness(0.98);
}
.name {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-base);
}
.meta {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.gender-pill {
  display: inline-flex;
  min-width: 34px;
  justify-content: center;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary-dark);
  background: rgba(93, 176, 169, 0.18);
}
.empty-cell {
  text-align: center;
  padding: 16px 10px;
  color: var(--text-muted);
  font-weight: 600;
}
.edit-btn {
  border: 1px solid rgba(93, 176, 169, 0.5);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--primary-dark);
  background: rgba(210, 241, 234, 0.58);
  cursor: pointer;
}
.editor-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(11, 29, 41, 0.44);
  display: grid;
  place-items: center;
  padding: 16px;
}
.editor {
  width: min(760px, 92vw);
  padding: 14px;
}
.editor h3 {
  margin: 0 0 10px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
}
.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.editor-grid label {
  display: grid;
  gap: 4px;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.editor-grid .input-readonly {
  background: rgba(0, 0, 0, 0.05);
  cursor: not-allowed;
  color: var(--text-muted);
}
.editor-grid .full {
  grid-column: span 2;
}
.editor-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.editor-actions button {
  border: 0;
  border-radius: 8px;
  padding: 8px 10px;
  font-weight: 700;
  cursor: pointer;
}
.editor-actions .ghost {
  color: var(--primary-dark);
  background: rgba(226, 237, 245, 0.75);
}
.editor-actions .solid {
  color: #fff;
  background: linear-gradient(140deg, var(--primary), var(--secondary));
}
.edad-mini {
  display: block;
  margin-top: 5px;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--primary-dark);
}
@media (max-width: 760px) {
  .filters {
    flex-wrap: wrap;
  }
  input,
  select,
  .clear-btn {
    width: 100%;
  }
  .editor-grid {
    grid-template-columns: 1fr;
  }
  .editor-grid .full {
    grid-column: span 1;
  }
}
</style>
