<template>
  <section class="doctor-register">
    <PageHero
      pill="Administración"
      title="Registrar médico"
      subtitle="Da de alta un profesional en el sistema: datos de contacto, especialidad y franjas de consulta visibles en agenda."
    >
      <template #actions>
        <RouterLink to="/app/dashboard" class="back-link">
          <ArrowLeft :size="18" aria-hidden="true" />
          Panel
        </RouterLink>
      </template>
    </PageHero>

    <div v-if="!store.canManageDoctors" class="surface-card locked-card">
      <div class="locked-inner">
        <span class="locked-icon" aria-hidden="true"><ShieldOff :size="40" /></span>
        <div>
          <h2>Acceso no autorizado</h2>
          <p>{{ ACCESO_NO_AUTORIZADO }}</p>
        </div>
      </div>
      <RouterLink to="/app/dashboard" class="cta-ghost">Ir al panel</RouterLink>
    </div>

    <article v-else class="surface-card main-card">
        <form class="form-body" @submit.prevent="onSubmit">
          <section class="form-section">
            <h2 class="section-title"><UserRound :size="20" aria-hidden="true" /> Datos profesionales</h2>
            <div class="grid-2">
              <label class="field">
                <span class="field-label">Nombre completo</span>
                <input v-model="form.nombre" type="text" autocomplete="name" placeholder="Dra. Elena Ruiz" />
              </label>
              <label class="field">
                <span class="field-label">Correo institucional</span>
                <input v-model="form.correo" type="email" autocomplete="email" placeholder="nombre@clinica.com" />
              </label>
              <label class="field">
                <span class="field-label">Especialidad</span>
                <input v-model="form.especialidad" type="text" placeholder="Cardiología, medicina interna…" />
              </label>
              <label class="field">
                <span class="field-label">Contraseña</span>
                <input v-model="form.password" type="password" autocomplete="new-password" />
              </label>
            </div>
          </section>

          <section class="form-section">
            <div class="section-head">
              <h2 class="section-title"><CalendarRange :size="20" aria-hidden="true" /> Disponibilidad semanal</h2>
              <div class="presets">
                <button type="button" class="preset-chip" @click="applyPreset('lv_morning')">Lun–Vie mañana</button>
                <button type="button" class="preset-chip" @click="applyPreset('lv_split')">Lun–Vie 8–12 y 14–18</button>
                <button type="button" class="preset-chip" @click="applyPreset('clear')">Limpiar días</button>
              </div>
            </div>

            <div class="schedule-wrap">
              <div
                v-for="slot in scheduleSlots"
                :key="slot.day"
                class="slot-card"
                :class="{ 'slot-card--on': slot.enabled }"
              >
                <label class="day-toggle">
                  <input v-model="slot.enabled" type="checkbox" />
                  <span class="day-name">{{ slot.day }}</span>
                </label>
                <div class="time-pair">
                  <label class="time-field">
                    <span>Inicio</span>
                    <input v-model="slot.start" type="time" :disabled="!slot.enabled" />
                  </label>
                  <span class="time-sep">—</span>
                  <label class="time-field">
                    <span>Fin</span>
                    <input v-model="slot.end" type="time" :disabled="!slot.enabled" />
                  </label>
                </div>
              </div>
            </div>
          </section>

          <div class="actions">
            <button class="submit-btn" type="submit">
              <Stethoscope :size="20" aria-hidden="true" />
              Registrar médico
            </button>
          </div>

          <p v-if="feedback" class="feedback" :class="{ ok: feedbackOk, err: !feedbackOk }">{{ feedback }}</p>
        </form>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ArrowLeft, CalendarRange, ShieldOff, Stethoscope, UserRound } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageHero from '../components/layout/PageHero.vue'
import { ACCESO_NO_AUTORIZADO } from '../domain/messages'
import { useClinicUiStore } from '../stores/ui'

const store = useClinicUiStore()
const feedback = ref('')
const feedbackOk = ref(false)

const form = reactive({
  nombre: '',
  correo: '',
  especialidad: '',
  password: '',
  horarioDisponible: '',
})

const scheduleSlots = reactive([
  { day: 'Lunes', enabled: true, start: '08:00', end: '12:00' },
  { day: 'Martes', enabled: true, start: '14:00', end: '18:00' },
  { day: 'Miercoles', enabled: false, start: '08:00', end: '12:00' },
  { day: 'Jueves', enabled: false, start: '08:00', end: '12:00' },
  { day: 'Viernes', enabled: false, start: '08:00', end: '12:00' },
  { day: 'Sabado', enabled: false, start: '09:00', end: '13:00' },
  { day: 'Domingo', enabled: false, start: '09:00', end: '13:00' },
])

const serializeSchedule = () =>
  scheduleSlots
    .filter((slot) => slot.enabled)
    .map((slot) => `${slot.day} ${slot.start}-${slot.end}`)
    .join(', ')

const resetSchedule = () => {
  scheduleSlots.forEach((slot, index) => {
    slot.enabled = index < 2
    slot.start = index === 1 ? '14:00' : '08:00'
    slot.end = index === 1 ? '18:00' : index > 4 ? '13:00' : '12:00'
  })
}

const applyPreset = (preset: 'lv_morning' | 'lv_split' | 'clear') => {
  if (preset === 'clear') {
    scheduleSlots.forEach((s) => {
      s.enabled = false
    })
    return
  }
  scheduleSlots.forEach((s, i) => {
    const isWeekday = i <= 4
    s.enabled = isWeekday
    if (!isWeekday) return
    if (preset === 'lv_morning') {
      s.start = '08:00'
      s.end = '12:00'
    } else {
      // Lun–Vie: alternate could be complex; use morning for all for first pass, user edits
      // lv_split: morning Mon Wed Fri, afternoon Tue Thu - simpler: all 8-12 and add second row - our model is one interval per day
      // So use 8-12 for Mon Wed Fri and 14-18 for Tue Thu
      if (i === 0 || i === 2 || i === 4) {
        s.start = '08:00'
        s.end = '12:00'
      } else {
        s.start = '14:00'
        s.end = '18:00'
      }
    }
  })
}

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

const onSubmit = async () => {
  feedback.value = ''
  const nombre = form.nombre.trim()
  const correo = form.correo.trim()
  const especialidad = form.especialidad.trim()
  const password = form.password.trim()

  if (!nombre || !correo || !especialidad) {
    feedbackOk.value = false
    feedback.value = 'Completa nombre, correo y especialidad.'
    return
  }
  if (!password) {
    feedbackOk.value = false
    feedback.value = 'Debes indicar una contraseña para el nuevo médico.'
    return
  }
  if (password.length < 6) {
    feedbackOk.value = false
    feedback.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (!emailOk(correo)) {
    feedbackOk.value = false
    feedback.value = 'Introduce un correo electrónico válido.'
    return
  }

  const enabled = scheduleSlots.filter((s) => s.enabled)
  if (!enabled.length) {
    feedbackOk.value = false
    feedback.value = 'Activa al menos un día con horario de consulta.'
    return
  }

  for (const s of enabled) {
    if (s.start >= s.end) {
      feedbackOk.value = false
      feedback.value = `En ${s.day}, la hora de fin debe ser posterior al inicio.`
      return
    }
  }

  form.horarioDisponible = serializeSchedule()
  const result = await store.registerDoctorByAdmin({
    nombre,
    correo,
    especialidad,
    horarioDisponible: form.horarioDisponible,
    password,
  })
  feedback.value = result.message
  feedbackOk.value = result.ok
  if (result.ok) {
    form.nombre = ''
    form.correo = ''
    form.especialidad = ''
    form.password = ''
    form.horarioDisponible = ''
    resetSchedule()
  }
}
</script>

<style scoped>
.doctor-register {
  max-width: 1080px;
  margin: 0 auto;
  display: grid;
  gap: 18px;
}

.locked-card {
  padding: 22px;
  display: grid;
  gap: 16px;
  border: 1px dashed rgba(197, 92, 106, 0.45);
  background: linear-gradient(145deg, rgba(255, 248, 248, 0.95), rgba(255, 255, 255, 0.88));
}

.locked-inner {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.locked-icon {
  flex-shrink: 0;
  color: var(--danger);
  opacity: 0.9;
}

.locked-card h2 {
  margin: 0 0 6px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.35rem;
  color: var(--primary-dark);
}

.locked-card p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.5;
}

.cta-ghost {
  justify-self: start;
  padding: 9px 16px;
  border-radius: 10px;
  font-weight: 700;
  color: var(--primary-dark);
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
}

.main-card {
  padding: 0;
  overflow: hidden;
}

.form-body {
  padding: 20px 22px 22px;
  display: grid;
  gap: 22px;
}

.form-section {
  display: grid;
  gap: 14px;
}

.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.08rem;
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  color: var(--primary-dark);
}

.section-title svg {
  color: var(--primary);
  opacity: 0.9;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: grid;
  gap: 6px;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-main);
}

.field input {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  background: rgba(255, 255, 255, 0.92);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.field input:hover:not(:disabled) {
  border-color: rgba(58, 143, 183, 0.35);
}
.field input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(58, 143, 183, 0.2);
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-chip {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary-dark);
  background: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.preset-chip:hover {
  background: rgba(223, 240, 248, 0.8);
  border-color: rgba(58, 143, 183, 0.35);
}

.schedule-wrap {
  display: grid;
  gap: 10px;
}

.slot-card {
  display: grid;
  grid-template-columns: minmax(0, 140px) 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(248, 252, 255, 0.65);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.slot-card--on {
  background: linear-gradient(120deg, rgba(223, 247, 240, 0.55), rgba(237, 247, 252, 0.9));
  border-color: rgba(112, 189, 178, 0.35);
}

.day-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 700;
  color: var(--text-main);
}

.day-toggle input {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
}

.day-name {
  font-size: 0.92rem;
}

.time-pair {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.time-field {
  display: grid;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
}

.time-field input {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 8px;
  font: inherit;
  background: #fff;
}

.time-field input:disabled {
  opacity: 0.45;
}

.time-sep {
  padding-bottom: 8px;
  color: var(--text-muted);
  font-weight: 600;
}

.actions {
  padding-top: 4px;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  border: 0;
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(125deg, var(--primary), #2d7a9e);
  box-shadow: 0 8px 22px rgba(58, 143, 183, 0.28);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(58, 143, 183, 0.32);
}

.feedback {
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
}

.feedback.ok {
  color: var(--success);
  background: rgba(47, 138, 105, 0.1);
  border: 1px solid rgba(47, 138, 105, 0.25);
}

.feedback.err {
  color: var(--danger);
  background: rgba(197, 92, 106, 0.08);
  border: 1px solid rgba(197, 92, 106, 0.25);
}

@media (max-width: 920px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
  .slot-card {
    grid-template-columns: 1fr;
  }
  .time-pair {
    width: 100%;
  }
}
</style>
