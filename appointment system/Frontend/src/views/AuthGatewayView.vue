<template>
  <section class="auth-shell auth-minimal">
    <header class="auth-brand" aria-label="Clínica Aura">
      <p class="brand-title">
        Clínica <span class="brand-accent">Aura</span>
      </p>
    </header>

    <div class="auth-columns">
    <aside class="left-side">
      <h1>Tu bienestar empieza con una atencion humana.</h1>
      <p>
        Gestiona tus citas, seguimiento y notificaciones en un entorno clinico claro, suave y confiable.
      </p>
      <ul>
        <li>Atencion personalizada para cada paciente</li>
        <li>Agenda medica simple y ordenada</li>
        <li>Recordatorios para no perder tus citas</li>
      </ul>
      <ClinicIllustration class="illustration" />
    </aside>

    <section class="right-side">
      <nav class="switch">
        <RouterLink to="/login" class="switch-btn" :class="{ active: isLogin }">Iniciar sesion</RouterLink>
        <RouterLink to="/register" class="switch-btn" :class="{ active: !isLogin }">Registrarse</RouterLink>
      </nav>

      <transition name="panel-swap" mode="out-in">
        <article :key="isLogin ? 'login' : 'register'" class="form-panel">
          <template v-if="isLogin">
            <p class="kicker">Acceso pacientes y equipo clinico</p>
            <h2>Iniciar sesion</h2>
            <p class="subtitle">Continua con tu cuenta y revisa tu agenda de hoy.</p>
            <label class="line-field">Email <input v-model="loginForm.email" type="email" placeholder="correo@clinica.com" /></label>
            <label class="line-field">Contrasena <input v-model="loginForm.password" type="password" placeholder="********" /></label>
            <button type="button" class="cta" @click="submitLogin">Iniciar sesion</button>
            <p v-if="feedback" class="feedback">{{ feedback }}</p>
          </template>

          <template v-else>
            <h2>Crea tu cuenta de paciente</h2>
            <p class="subtitle">El registro publico siempre crea cuentas con rol Paciente.</p>
            <div class="grid-2">
              <label class="line-field">Nombre completo <input v-model="registerForm.nombre" placeholder="Nombre y apellido" /></label>
              <label class="line-field">Email <input v-model="registerForm.correo" type="email" placeholder="correo@email.com" /></label>
              <label class="line-field">Teléfono (8 dígitos) <PhoneInputCr v-model="registerForm.telefono" /></label>
              <label class="line-field"
                >Fecha de nacimiento
                <input v-model="registerForm.fechaNacimiento" type="date" :max="maxBirthDate" :min="minBirthDate" />
                <span v-if="registerForm.fechaNacimiento" class="edad-hint">Edad calculada: {{ edadRegistro }} años</span>
              </label>
              <label class="line-field">Genero
                <select v-model="registerForm.genero">
                  <option value="F">F</option>
                  <option value="M">M</option>
                  <option value="Otro">Otro</option>
                </select>
              </label>
              <label class="line-field">Rol
                <input value="Paciente" disabled />
              </label>
            </div>
            <label class="line-field">Contrasena <input v-model="registerForm.password" type="password" placeholder="********" /></label>
            <button type="button" class="cta" @click="submitRegister">Crear cuenta</button>
            <p v-if="feedback" class="feedback">{{ feedback }}</p>
          </template>
        </article>
      </transition>
    </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ageFromBirthDate } from '../domain/ageFromBirth'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import ClinicIllustration from '../components/ui/ClinicIllustration.vue'
import PhoneInputCr from '../components/ui/PhoneInputCr.vue'
import { isCompletePhoneCr } from '../domain/phoneCr'
import { useClinicUiStore } from '../stores/ui'

const router = useRouter()
const route = useRoute()
const store = useClinicUiStore()
const feedback = ref('')

const isLogin = computed(() => route.path === '/login')
watch(isLogin, () => {
  feedback.value = ''
})

const loginForm = reactive({
  email: '',
  password: '',
})

const registerForm = reactive({
  nombre: '',
  correo: '',
  telefono: '',
  fechaNacimiento: '',
  genero: 'F' as 'F' | 'M' | 'Otro',
  password: '',
})

const maxBirthDate = computed(() => new Date().toISOString().slice(0, 10))
const minBirthDate = computed(() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 120)
  return d.toISOString().slice(0, 10)
})
const edadRegistro = computed(() =>
  registerForm.fechaNacimiento ? ageFromBirthDate(registerForm.fechaNacimiento) : null,
)

const submitRegister = async () => {
  if (!registerForm.nombre || !registerForm.correo || !registerForm.telefono || !registerForm.password) {
    feedback.value = 'Completa nombre, email, telefono y contrasena.'
    return
  }
  if (!registerForm.fechaNacimiento) {
    feedback.value = 'Indica tu fecha de nacimiento.'
    return
  }
  if (registerForm.password.length < 6) {
    feedback.value = 'La contrasena debe tener al menos 6 caracteres.'
    return
  }
  if (!isCompletePhoneCr(registerForm.telefono)) {
    feedback.value = 'El telefono debe tener 8 digitos (formato 0000-0000).'
    return
  }
  const result = await store.registerPatientAccount({
    nombre: registerForm.nombre,
    correo: registerForm.correo,
    password: registerForm.password,
    telefono: registerForm.telefono,
    fechaNacimiento: registerForm.fechaNacimiento,
    genero: registerForm.genero,
  })
  feedback.value = result.message
  if (result.ok) setTimeout(() => router.push('/login'), 700)
}

const submitLogin = async () => {
  const result = await store.loginWithCredentials({
    correo: loginForm.email,
    password: loginForm.password,
  })
  feedback.value = result.message
  if (result.ok) router.push('/app/dashboard')
}
</script>

<style scoped>
.auth-shell {
  min-height: 100vh;
  padding: 14px 22px 28px;
  max-width: 1140px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.auth-minimal {
  max-width: 980px;
}
.auth-brand {
  text-align: center;
  padding: 4px 12px 6px;
  width: 100%;
  margin-bottom: 0;
}
.brand-title {
  margin: 50px 0 0 0;
  font-family: 'Playfair Display', 'Times New Roman', serif;
  font-size: clamp(2rem, 4.2vw, 2.85rem);
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1.05;
  color: var(--primary-dark);
  text-shadow: 0 2px 28px rgba(34, 95, 128, 0.12);
}
.brand-accent {
  font-style: italic;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--primary);
}

@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .brand-accent {
    background: linear-gradient(125deg, var(--primary-dark) 0%, var(--primary) 50%, var(--secondary) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}
.auth-columns {
  display: grid;
  grid-template-columns: 1fr 0.78fr;
  gap: 26px;
  align-items: center;
  flex: 1;
}
.left-side {
  padding: 22px;
  display: grid;
  gap: 10px;
  align-content: center;
}
h1 {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.75rem, 2.8vw, 2.4rem);
  line-height: 1.1;
}
p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}
ul {
  margin: 2px 0 0;
  padding-left: 16px;
  color: var(--text-main);
  display: grid;
  gap: 5px;
  font-size: 0.9rem;
}
.illustration {
  margin-top: 2px;
}
.right-side {
  padding: 18px;
  display: grid;
  align-content: center;
}
.auth-minimal .left-side,
.auth-minimal .right-side {
  padding: 10px 4px;
}
.auth-minimal .left-side {
  border-right: 1px solid rgba(124, 166, 186, 0.25);
  padding-right: 24px;
}
.auth-minimal .right-side {
  padding-left: 20px;
}
.switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}
.auth-minimal .switch {
  width: 72%;
  min-width: 260px;
  margin-bottom: 14px;
}
.switch-btn {
  text-align: center;
  border-radius: 10px;
  padding: 9px;
  font-weight: 700;
  color: var(--primary-dark);
  background: rgba(255, 255, 255, 0.55);
}
.switch-btn.active {
  color: #fff;
  background: linear-gradient(125deg, var(--primary), var(--secondary));
}
.form-panel {
  display: grid;
  gap: 9px;
  max-width: 420px;
}
h2 {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.75rem;
}
.kicker {
  margin: 0;
  color: var(--primary-dark);
  font-size: 0.77rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}
.subtitle {
  margin: 0 0 2px;
  color: var(--text-muted);
  font-size: 0.9rem;
}
label {
  display: grid;
  gap: 5px;
  font-weight: 600;
  font-size: 0.9rem;
}
.line-field input {
  border: 0;
  border-bottom: 1px solid rgba(92, 136, 158, 0.36);
  border-radius: 0;
  padding-left: 0;
  padding-right: 0;
  background: transparent;
}
.line-field input:focus {
  outline: none;
  border-bottom-color: var(--primary);
}
.line-field select {
  border: 0;
  border-bottom: 1px solid rgba(92, 136, 158, 0.36);
  border-radius: 0;
  padding-left: 0;
  padding-right: 0;
  background: transparent;
}
.line-field select:focus {
  outline: none;
  border-bottom-color: var(--primary);
}
.line-field input:disabled {
  color: var(--text-muted);
}
input,
select {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 9px 10px;
  font: inherit;
  background: rgba(255, 255, 255, 0.72);
}
.cta {
  border: 0;
  border-radius: 10px;
  padding: 10px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(125deg, var(--primary), var(--secondary));
}
.auth-minimal .cta {
  margin-top: 6px;
}
.edad-hint {
  display: block;
  margin-top: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary-dark);
}
.feedback {
  margin: 0;
  color: var(--primary-dark);
  font-weight: 700;
}
.panel-swap-enter-active,
.panel-swap-leave-active {
  transition: all 0.28s ease;
}
.panel-swap-enter-from {
  opacity: 0;
  transform: translateX(18px);
}
.panel-swap-leave-to {
  opacity: 0;
  transform: translateX(-14px);
}
@media (max-width: 980px) {
  .auth-shell {
    max-width: 620px;
  }
  .auth-columns {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .auth-brand {
    padding: 2px 12px 6px;
  }
  .auth-minimal {
    gap: 10px;
  }
  .auth-minimal .left-side {
    border-right: 0;
    border-bottom: 1px solid rgba(124, 166, 186, 0.25);
    padding-right: 4px;
    padding-bottom: 14px;
  }
  .auth-minimal .right-side {
    padding-left: 4px;
  }
  .left-side {
    padding: 18px;
  }
  .right-side {
    padding: 16px;
  }
}
</style>
