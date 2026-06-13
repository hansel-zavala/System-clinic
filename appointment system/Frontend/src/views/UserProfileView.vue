<template>
  <section>
    <PageHero
      pill="Cuenta"
      title="Perfil de usuario"
      subtitle="Interfaz compacta de cuenta, horario y seguridad."
    />

    <article class="surface-card profile">
      <div class="profile-grid">
        <aside class="avatar-identity" aria-label="Foto de perfil">
          <div class="avatar-identity__accent" aria-hidden="true"></div>
          <div class="avatar-identity__inner">
            <div class="avatar-frame">
              <img
                class="avatar-img"
                :src="form.fotoUrl || placeholderAvatar"
                alt=""
              />
              <div v-if="photoUploading" class="avatar-frame__loading" aria-live="polite">
                <span class="avatar-frame__spinner"></span>
                <span>Subiendo…</span>
              </div>
            </div>
            <input
              ref="photoInputRef"
              type="file"
              class="visually-hidden"
              accept="image/jpeg,image/png,image/webp,image/gif"
              :disabled="photoUploading"
              tabindex="-1"
              @change="onProfilePhotoSelected"
            />
            <button
              type="button"
              class="btn-avatar-upload"
              :disabled="photoUploading"
              @click="openPhotoPicker"
            >
              {{ photoUploading ? 'Subiendo…' : 'Elegir imagen' }}
            </button>
            <p class="avatar-identity__hint">JPG, PNG, WebP o GIF · máx. 2&nbsp;MB</p>
          </div>
        </aside>

        <div class="profile-main">
        <div class="row">
          <h3>{{ store.currentUser.nombre }}</h3>
          <StatusBadge :value="store.currentUser.rol" />
        </div>
        <div class="grid-2 compact-grid">
          <label>Nombre <input v-model="form.nombre" /></label>
          <label
            >Correo
            <input :value="form.correo" type="email" readonly class="input-readonly" title="El correo no se puede modificar" />
          </label>
          <label>Especialidad <input v-model="form.especialidad" :disabled="store.currentUser.rol === 'paciente'" /></label>
        </div>

        <div class="quick-tools">
          <button
            v-if="canEditSchedule"
            type="button"
            class="small-btn"
            @click="scheduleModalOpen = true"
          >
            Configurar horario
          </button>
          <button type="button" class="small-btn" @click="securityModalOpen = true">Cambiar seguridad</button>
        </div>
        <p v-if="canEditSchedule" class="mini-info">Horario: {{ form.horarioDisponible || 'No configurado' }}</p>

        <section v-if="isStaffForSignature" class="signature-block">
          <h4>Firma digital</h4>
          <div class="signature-wrap">
            <canvas
              ref="signatureCanvas"
              class="signature-canvas"
              @mousedown="startDraw"
              @mousemove="draw"
              @mouseup="endDraw"
              @mouseleave="endDraw"
            ></canvas>
            <div class="signature-preview">
              <img v-if="signatureDataUrl" :src="signatureDataUrl" alt="Firma guardada" />
              <span v-else>{{ initialsFallback }}</span>
            </div>
          </div>
          <div class="signature-actions">
            <button type="button" class="small-btn" @click="clearSignature">Limpiar firma</button>
          </div>
        </section>

        <div class="actions">
          <button type="button" @click="saveProfile">Guardar perfil</button>
        </div>
        <p v-if="profileMsg" class="msg">{{ profileMsg }}</p>
        </div>
      </div>
    </article>

    <article v-if="store.currentPatientRecord" class="surface-card section">
      <h3>Ficha de paciente</h3>
      <div class="grid-2 compact-grid">
        <label>Teléfono
          <PhoneInputCr v-model="patientForm.telefono" />
        </label>
        <label
          >Fecha de nacimiento
          <input v-model="patientForm.fechaNacimiento" type="date" :max="maxBirthDate" />
          <span v-if="patientForm.fechaNacimiento" class="hint-edad">Edad: {{ edadPaciente }} años</span>
        </label>
        <label>Genero
          <select v-model="patientForm.genero">
            <option value="F">F</option>
            <option value="M">M</option>
            <option value="Otro">Otro</option>
          </select>
        </label>
        <label>Tipo de sangre
          <select v-model="patientForm.tipoSangre">
            <option value="">Seleccionar…</option>
            <option v-for="bt in BLOOD_TYPES" :key="bt" :value="bt">{{ bt }}</option>
          </select>
        </label>
        <label>Alergias <input v-model="patientForm.alergias" /></label>
        <label>Medicamentos <input v-model="patientForm.medicamentosHabituales" /></label>
        <label>Calle <input v-model="patientForm.calle" /></label>
        <label>Ciudad <input v-model="patientForm.ciudad" /></label>
      </div>
      <label>Notas medicas <textarea v-model="patientForm.notasMedico" rows="2" /></label>
      <div class="actions">
        <button type="button" @click="savePatientRecord">Guardar ficha</button>
      </div>
      <Transition name="ficha-saved">
        <div v-if="patientFichaSuccess" class="ficha-saved-toast" role="status" aria-live="polite">
          <div class="ficha-saved-toast__glow" aria-hidden="true"></div>
          <div class="ficha-saved-toast__content">
            <span class="ficha-saved-toast__ring" aria-hidden="true">
              <span class="ficha-saved-toast__check">✓</span>
            </span>
            <div class="ficha-saved-toast__text">
              <p class="ficha-saved-toast__title">Ficha guardada</p>
              <p class="ficha-saved-toast__hint">Tus datos clínicos quedaron registrados en el sistema.</p>
            </div>
          </div>
        </div>
      </Transition>
      <p v-if="patientMsg && !patientFichaSuccess" class="msg">{{ patientMsg }}</p>
    </article>

    <div v-if="canEditSchedule && scheduleModalOpen" class="modal-backdrop" @click.self="scheduleModalOpen = false">
      <article class="surface-card modal-card">
        <h3>Configurar horario</h3>
        <div class="schedule-grid">
          <div v-for="slot in scheduleSlots" :key="slot.day" class="slot-row">
            <label class="day-toggle">
              <input v-model="slot.enabled" type="checkbox" />
              <span>{{ slot.day }}</span>
            </label>
            <input v-model="slot.start" type="time" :disabled="!slot.enabled" />
            <input v-model="slot.end" type="time" :disabled="!slot.enabled" />
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="small-btn" @click="scheduleModalOpen = false">Cancelar</button>
          <button type="button" @click="saveScheduleOnly">Guardar horario</button>
        </div>
      </article>
    </div>

    <div v-if="securityModalOpen" class="modal-backdrop" @click.self="securityModalOpen = false">
      <article class="surface-card modal-card">
        <h3>Actualizar seguridad</h3>
        <div class="security-form">
          <input v-model="security.currentPass" type="password" placeholder="Contrasena actual" />
          <input v-model="security.newPass" type="password" placeholder="Nueva contrasena" />
          <input v-model="security.confirmPass" type="password" placeholder="Confirmacion" />
        </div>
        <div class="modal-actions">
          <button type="button" class="small-btn" @click="securityModalOpen = false">Cancelar</button>
          <button type="button" @click="changePassword">Actualizar</button>
        </div>
        <p v-if="securityMsg" class="msg">{{ securityMsg }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ageFromBirthDate } from '../domain/ageFromBirth'
import type { Patient } from '../domain/types'
import { computed, nextTick, onUnmounted, reactive, ref, watch } from 'vue'
import PageHero from '../components/layout/PageHero.vue'
import PhoneInputCr from '../components/ui/PhoneInputCr.vue'
import StatusBadge from '../components/ui/StatusBadge.vue'
import { BLOOD_TYPES } from '../domain/bloodTypes'
import { parsePhoneDigits, isCompletePhoneCr } from '../domain/phoneCr'
import { useClinicUiStore } from '../stores/ui'

const store = useClinicUiStore()
/** Firma en lienzo solo aplica a administración y personal médico. */
const isStaffForSignature = computed(
  () => store.currentRole === 'admin' || store.currentRole === 'medico',
)
/** Horario de atención: solo personal clínico (no pacientes). */
const canEditSchedule = computed(
  () => store.currentRole === 'admin' || store.currentRole === 'medico',
)
const profileMsg = ref('')
const patientMsg = ref('')
/** Banner animado tras guardar la ficha con éxito. */
const patientFichaSuccess = ref(false)
let patientFichaSuccessTimer: ReturnType<typeof setTimeout> | null = null

function showPatientFichaSavedFeedback() {
  patientFichaSuccess.value = true
  if (patientFichaSuccessTimer) clearTimeout(patientFichaSuccessTimer)
  patientFichaSuccessTimer = setTimeout(() => {
    patientFichaSuccess.value = false
    patientFichaSuccessTimer = null
  }, 4200)
}

onUnmounted(() => {
  if (patientFichaSuccessTimer) clearTimeout(patientFichaSuccessTimer)
})

const securityMsg = ref('')
const photoUploading = ref(false)
const photoInputRef = ref<HTMLInputElement | null>(null)

const openPhotoPicker = () => {
  if (photoUploading.value) return
  photoInputRef.value?.click()
}

/** Placeholder si aún no hay URL (evita imagen rota). */
const placeholderAvatar =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="102" height="102" viewBox="0 0 102 102"><rect fill="#e8eef2" width="102" height="102" rx="12"/><circle cx="51" cy="40" r="16" fill="#94a3b8"/><path fill="#94a3b8" d="M24 88c4-18 18-28 27-28h4c9 0 23 10 27 28H24z"/></svg>`,
  )
const scheduleModalOpen = ref(false)
const securityModalOpen = ref(false)
const signatureCanvas = ref<HTMLCanvasElement | null>(null)
const signatureDataUrl = ref('')
const isDrawing = ref(false)

const form = reactive({
  nombre: '',
  correo: '',
  especialidad: '',
  horarioDisponible: '',
  firmaDigital: '',
  fotoUrl: '',
})

const scheduleSlots = reactive([
  { day: 'Lunes', enabled: false, start: '08:00', end: '12:00' },
  { day: 'Martes', enabled: false, start: '08:00', end: '12:00' },
  { day: 'Miercoles', enabled: false, start: '08:00', end: '12:00' },
  { day: 'Jueves', enabled: false, start: '08:00', end: '12:00' },
  { day: 'Viernes', enabled: false, start: '08:00', end: '12:00' },
  { day: 'Sabado', enabled: false, start: '09:00', end: '13:00' },
  { day: 'Domingo', enabled: false, start: '09:00', end: '13:00' },
])

const patientForm = reactive({
  telefono: '',
  fechaNacimiento: '',
  genero: 'F' as 'F' | 'M' | 'Otro',
  tipoSangre: '',
  alergias: '',
  medicamentosHabituales: '',
  calle: '',
  ciudad: '',
  notasMedico: '',
})

const security = reactive({
  currentPass: '',
  newPass: '',
  confirmPass: '',
})

const maxBirthDate = computed(() => new Date().toISOString().slice(0, 10))
const edadPaciente = computed(() =>
  patientForm.fechaNacimiento ? ageFromBirthDate(patientForm.fechaNacimiento) : null,
)

const initialsFallback = computed(() =>
  form.nombre
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'FD',
)

const setupCanvas = () => {
  const canvas = signatureCanvas.value
  if (!canvas) return
  const ratio = window.devicePixelRatio || 1
  const width = 360
  const height = 120
  canvas.width = width * ratio
  canvas.height = height * ratio
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(ratio, ratio)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 2.2
  ctx.strokeStyle = '#225f80'
  ctx.fillStyle = 'rgba(255,255,255,0.96)'
  ctx.fillRect(0, 0, width, height)
}

const parseSchedule = (text: string | undefined) => {
  scheduleSlots.forEach((slot) => {
    slot.enabled = false
  })
  if (!text) return
  const chunks = text.split(',').map((item) => item.trim())
  chunks.forEach((chunk) => {
    const match = chunk.match(/^([A-Za-z]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/)
    if (!match) return
    const target = scheduleSlots.find((slot) => slot.day === match[1])
    if (!target) return
    target.enabled = true
    target.start = match[2]
    target.end = match[3]
  })
}

const serializeSchedule = () =>
  scheduleSlots
    .filter((slot) => slot.enabled)
    .map((slot) => `${slot.day} ${slot.start}-${slot.end}`)
    .join(', ')

const getCanvasPosition = (event: MouseEvent) => {
  const canvas = signatureCanvas.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

const startDraw = (event: MouseEvent) => {
  const canvas = signatureCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const pos = getCanvasPosition(event)
  isDrawing.value = true
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
}

const draw = (event: MouseEvent) => {
  if (!isDrawing.value) return
  const canvas = signatureCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const pos = getCanvasPosition(event)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

const endDraw = () => {
  if (!isDrawing.value) return
  isDrawing.value = false
  const canvas = signatureCanvas.value
  if (!canvas) return
  signatureDataUrl.value = canvas.toDataURL('image/png')
}

const clearSignature = () => {
  setupCanvas()
  signatureDataUrl.value = ''
}

const loadSignatureToCanvas = async () => {
  await nextTick()
  setupCanvas()
  if (!form.firmaDigital || !form.firmaDigital.startsWith('data:image')) {
    signatureDataUrl.value = ''
    return
  }
  const canvas = signatureCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 360, 120)
    signatureDataUrl.value = form.firmaDigital
  }
  img.src = form.firmaDigital
}

const syncForms = () => {
  form.nombre = store.currentUser.nombre ?? ''
  form.correo = store.currentUser.correo ?? ''
  form.especialidad = store.currentUser.especialidad ?? ''
  form.horarioDisponible = store.currentUser.horarioDisponible ?? ''
  form.firmaDigital = store.currentUser.firmaDigital ?? ''
  form.fotoUrl = store.currentUser.fotoUrl ?? ''
  parseSchedule(form.horarioDisponible)
  if (isStaffForSignature.value) {
    void loadSignatureToCanvas()
  } else {
    signatureDataUrl.value = ''
  }

  if (store.currentPatientRecord) {
    const pr = store.currentPatientRecord
    patientForm.telefono = parsePhoneDigits(pr.telefono ?? '')
    patientForm.fechaNacimiento = pr.fechaNacimiento ?? ''
    patientForm.genero = pr.genero
    patientForm.tipoSangre = pr.tipoSangre ?? ''
    patientForm.alergias = store.patientAllergiesLine(pr)
    patientForm.medicamentosHabituales = store.patientMedicationsLine(pr)
    patientForm.calle = pr.direccion.calle ?? ''
    patientForm.ciudad = pr.direccion.ciudad ?? ''
    patientForm.notasMedico = pr.notasMedico ?? ''
  }
}

watch(
  () => [store.currentUser.id, store.currentPatientRecord?.id, store.currentRole],
  () => syncForms(),
  { immediate: true },
)

const saveProfile = async () => {
  type U = import('../domain/types').UserProfile
  const payload: Partial<U> = {
    nombre: form.nombre,
    especialidad: form.especialidad,
    fotoUrl: form.fotoUrl,
  }
  if (canEditSchedule.value) {
    form.horarioDisponible = serializeSchedule()
    payload.horarioDisponible = form.horarioDisponible
  }
  if (isStaffForSignature.value) {
    form.firmaDigital = signatureDataUrl.value || initialsFallback.value
    payload.firmaDigital = form.firmaDigital
  }
  const result = await store.updateCurrentUserProfile(payload)
  profileMsg.value = result.message
}

const saveScheduleOnly = async () => {
  form.horarioDisponible = serializeSchedule()
  const result = await store.updateCurrentUserProfile({ horarioDisponible: form.horarioDisponible })
  profileMsg.value = result.message
  scheduleModalOpen.value = false
}

const savePatientRecord = async () => {
  if (!isCompletePhoneCr(patientForm.telefono)) {
    patientMsg.value = 'Indica un teléfono válido de 8 dígitos (0000-0000).'
    return
  }
  const patientId = store.currentPatientRecord?.id
  if (!patientId) {
    patientMsg.value = 'No hay ficha de paciente asociada.'
    return
  }
  /**
   * Texto congelado antes de cualquier await (evita que syncForms pise el formulario).
   * Orden: primero sincronizar alergias/meds al store y a la API; luego la ficha del paciente.
   * Así, cuando se actualiza `patients`, patientAllergies ya refleja lo guardado.
   */
  const alergiasText = String(patientForm.alergias ?? '')
  const medicamentosText = String(patientForm.medicamentosHabituales ?? '')

  const patch: Partial<Patient> = {
    telefono: parsePhoneDigits(patientForm.telefono),
    genero: patientForm.genero,
    tipoSangre: patientForm.tipoSangre,
    notasMedico: patientForm.notasMedico,
    direccion: {
      calle: patientForm.calle,
      ciudad: patientForm.ciudad,
    },
  }
  if (patientForm.fechaNacimiento) {
    patch.fechaNacimiento = patientForm.fechaNacimiento
  }

  try {
    await store.syncPatientAllergiesFromPlainText(patientId, alergiasText)
    await store.syncPatientMedicationsFromPlainText(patientId, medicamentosText)
  } catch (e) {
    console.error('[perfil] sincronizar alergias/medicamentos:', e)
    patientMsg.value = e instanceof Error ? e.message : 'No se pudieron guardar alergias o medicamentos.'
    return
  }

  const result = await store.updateCurrentPatientProfile(patch)
  if (result.ok) {
    patientMsg.value = ''
    showPatientFichaSavedFeedback()
  } else {
    patientMsg.value = result.message
  }
}

const onProfilePhotoSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  photoUploading.value = true
  profileMsg.value = ''
  try {
    const result = await store.uploadProfilePhoto(file)
    profileMsg.value = result.message
    if (result.ok) {
      form.fotoUrl = store.currentUser.fotoUrl ?? ''
    }
  } finally {
    photoUploading.value = false
  }
}

const changePassword = async () => {
  const result = await store.changeCurrentUserPassword(security)
  securityMsg.value = result.message
  if (result.ok) {
    security.currentPass = ''
    security.newPass = ''
    security.confirmPass = ''
  }
}

</script>

<style scoped>
.profile {
  margin-top: 16px;
  padding: 0;
  overflow: hidden;
}
.profile-grid {
  display: grid;
  grid-template-columns: minmax(200px, 240px) minmax(0, 1fr);
  gap: 0;
  align-items: stretch;
  min-height: 0;
}
.profile-main {
  padding: 16px 18px 18px;
  min-width: 0;
}
.section {
  margin-top: 14px;
  padding: 12px;
  display: grid;
  gap: 10px;
}
h4 {
  margin: 0;
  font-size: 1rem;
}
/* Panel lateral: foto (no compite en ancho con el formulario) */
.avatar-identity {
  position: relative;
  padding: 20px 18px 22px;
  background: linear-gradient(
    165deg,
    rgba(13, 48, 62, 0.06) 0%,
    rgba(58, 143, 183, 0.12) 45%,
    rgba(255, 255, 255, 0.55) 100%
  );
  border-right: 1px solid rgba(58, 143, 183, 0.18);
  min-width: 0;
}
.avatar-identity__accent {
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 100%;
  background: linear-gradient(180deg, #2d6a7f 0%, #3a8fb7 55%, #7eb8c9 100%);
  border-radius: 0 4px 4px 0;
  opacity: 0.95;
}
.avatar-identity__inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}
.avatar-frame {
  position: relative;
  width: 132px;
  height: 132px;
  border-radius: 36% 64% 48% 52% / 52% 38% 62% 48%;
  padding: 4px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(58, 143, 183, 0.25));
  box-shadow:
    0 12px 28px rgba(13, 30, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}
.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 32% 68% 45% 55% / 48% 42% 58% 52%;
  object-fit: cover;
  display: block;
  background: #e8eef2;
}
.avatar-frame__loading {
  position: absolute;
  inset: 4px;
  border-radius: inherit;
  background: rgba(13, 30, 42, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.avatar-frame__spinner {
  width: 26px;
  height: 26px;
  border: 3px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: avatar-spin 0.7s linear infinite;
}
@keyframes avatar-spin {
  to {
    transform: rotate(360deg);
  }
}
.btn-avatar-upload {
  width: 100%;
  max-width: 200px;
  margin: 0;
  padding: 10px 14px;
  border: 1px solid rgba(45, 106, 127, 0.35);
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #0d3042;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 4px 14px rgba(13, 30, 42, 0.08);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-avatar-upload:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(13, 30, 42, 0.12);
}
.btn-avatar-upload:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.avatar-identity__hint {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted, #64748b);
  line-height: 1.35;
  max-width: 14rem;
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
h3 {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.6rem;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
label {
  display: grid;
  gap: 4px;
  font-weight: 600;
  font-size: 0.86rem;
}
.hint-edad {
  margin-top: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary-dark);
}
input {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 9px;
  font: inherit;
}
.input-readonly {
  background: rgba(0, 0, 0, 0.05);
  cursor: not-allowed;
  color: var(--text-muted, #64748b);
}
select,
textarea {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 9px;
  font: inherit;
  background: rgba(255, 255, 255, 0.82);
}
.actions {
  margin-top: 8px;
}
button {
  border: 0;
  border-radius: 8px;
  padding: 7px 10px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(125deg, var(--primary), var(--secondary));
  cursor: pointer;
}
.small-btn {
  background: rgba(58, 143, 183, 0.16);
  color: var(--primary-dark);
}
.quick-tools {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.mini-info {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}
.msg {
  margin: 8px 0 0;
  color: var(--primary-dark);
  font-weight: 700;
}

/* Confirmación creativa al guardar ficha de paciente */
.ficha-saved-toast {
  position: relative;
  margin-top: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(45, 106, 127, 0.28);
  background: linear-gradient(
    125deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(186, 230, 213, 0.45) 42%,
    rgba(125, 211, 192, 0.35) 100%
  );
  box-shadow:
    0 10px 32px rgba(13, 48, 62, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
.ficha-saved-toast__glow {
  position: absolute;
  inset: -40% -20% auto;
  height: 120%;
  background: radial-gradient(ellipse at 30% 0%, rgba(45, 212, 191, 0.35), transparent 55%);
  pointer-events: none;
  animation: ficha-glow-drift 3s ease-in-out infinite alternate;
}
@keyframes ficha-glow-drift {
  from {
    opacity: 0.5;
    transform: translateX(-4%) scale(1);
  }
  to {
    opacity: 0.85;
    transform: translateX(4%) scale(1.05);
  }
}
.ficha-saved-toast__content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 1;
}
.ficha-saved-toast__ring {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #0f766e, #14b8a6);
  box-shadow: 0 6px 16px rgba(15, 118, 110, 0.45);
  animation: ficha-ring-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes ficha-ring-pop {
  0% {
    transform: scale(0.2) rotate(-25deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
.ficha-saved-toast__check {
  font-size: 1.35rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  animation: ficha-check-tick 0.4s 0.2s ease-out both;
}
@keyframes ficha-check-tick {
  from {
    transform: scale(0) rotate(-40deg);
  }
  to {
    transform: scale(1) rotate(0deg);
  }
}
.ficha-saved-toast__text {
  min-width: 0;
}
.ficha-saved-toast__title {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.35rem;
  font-weight: 700;
  color: #0d3042;
  letter-spacing: 0.02em;
}
.ficha-saved-toast__hint {
  margin: 4px 0 0;
  font-size: 0.84rem;
  font-weight: 600;
  color: rgba(13, 48, 62, 0.72);
  line-height: 1.35;
}

.ficha-saved-enter-active {
  transition: all 0.45s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.ficha-saved-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.ficha-saved-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}
.ficha-saved-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.schedule-block,
.signature-block {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
}
.schedule-grid {
  margin-top: 6px;
  display: grid;
  gap: 8px;
}
.slot-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 8px;
  align-items: center;
}
.day-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.signature-wrap {
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 112px;
  gap: 10px;
}
.signature-canvas {
  border: 1px dashed var(--border);
  border-radius: 10px;
  background: #fff;
}
.signature-preview {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  display: grid;
  place-items: center;
  overflow: hidden;
  min-height: 84px;
}
.signature-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.signature-preview span {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.6rem;
  color: var(--primary-dark);
}
.signature-actions {
  margin-top: 8px;
}
.security-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(13, 30, 42, 0.4);
  display: grid;
  place-items: center;
  padding: 16px;
}
.modal-card {
  width: min(680px, 95vw);
  padding: 14px;
  display: grid;
  gap: 10px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.compact-grid {
  gap: 8px;
}
@media (max-width: 900px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
  .avatar-identity {
    border-right: none;
    border-bottom: 1px solid rgba(58, 143, 183, 0.18);
    padding-bottom: 20px;
  }
  .avatar-identity__accent {
    width: 100%;
    height: 5px;
    top: 0;
    left: 0;
    border-radius: 0 0 6px 6px;
  }
  .signature-wrap {
    grid-template-columns: 1fr;
  }
  .slot-row {
    grid-template-columns: 1fr;
  }
}
</style>
