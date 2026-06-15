<template>
  <div class="layout">
    <header class="topbar">
      <button class="menu-trigger" type="button" @click="openMenu">Menu</button>
      <div ref="notifRef" class="topbar-actions">
        <div class="notif-wrap">
          <button class="notif-btn" type="button" @click="notifOpen = !notifOpen">
            <Bell :size="16" />
            <span>Alertas</span>
            <b v-if="unreadCount">{{ unreadCount }}</b>
          </button>
          <article v-if="notifOpen" class="notif-menu">
            <p class="notif-title">Notificaciones</p>
            <ul v-if="store.notificationsForCurrentUser.length">
              <li v-for="item in store.notificationsForCurrentUser.slice(0, 6)" :key="item.id">
                <p>{{ item.mensaje }}</p>
                <button v-if="!item.leida" type="button" @click="store.markNotificationRead(item.id)">Marcar leida</button>
              </li>
            </ul>
            <p v-else class="notif-empty">Sin notificaciones</p>
          </article>
        </div>

        <button class="logout-orb" :class="{ armed: logoutArmed }" type="button" @click="handleLogoutClick">
          <LogOut :size="15" />
          <span>{{ logoutArmed ? 'Confirmar salida' : 'Cerrar sesion' }}</span>
        </button>
      </div>
    </header>

    <transition name="fade-overlay">
      <div v-if="menuOpen" class="radial-overlay" @click.self="closeMenu">
        <article class="core-circle" role="button" tabindex="0" @click.stop="goHomeQuick" @keydown.enter.prevent="goHomeQuick">
          <span class="core-logo" aria-hidden="true">
            <ShieldPlus :size="156" :stroke-width="1.2" />
          </span>
          <div class="core-visible-content">
            <p class="clinic-title">Clinica Aura</p>
          </div>
        </article>

        <RouterLink
          v-for="item in radialItems"
          :key="item.link.to"
          :to="item.to"
          class="orbit-item"
          :style="{
            '--x': item.x,
            '--y': item.y,
            '--x-soft': item.xSoft,
            '--y-soft': item.ySoft,
            '--delay': item.delay,
            '--scale': item.scale,
          }"
          @click="closeMenu"
        >
          <component :is="item.link.icon" :size="20" />
          <span>{{ item.link.label }}</span>
        </RouterLink>
      </div>
    </transition>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  Bell,
  CalendarClock,
  CalendarDays,
  CircleUserRound,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldPlus,
  Stethoscope,
  UsersRound,
} from 'lucide-vue-next'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useClinicUiStore } from '../../stores/ui'

const store = useClinicUiStore()
const router = useRouter()
const menuOpen = ref(false)
const logoutArmed = ref(false)
const notifOpen = ref(false)
const notifRef = ref<HTMLElement | null>(null)
let logoutTimer: number | undefined
const unreadCount = computed(() => store.notificationsForCurrentUser.filter((item) => !item.leida).length)

const openMenu = () => (menuOpen.value = true)
const closeMenu = () => (menuOpen.value = false)
const goHomeQuick = () => {
  closeMenu()
  router.push('/app/dashboard')
}
const resetLogoutArm = () => {
  logoutArmed.value = false
  if (logoutTimer) window.clearTimeout(logoutTimer)
}
const handleLogoutClick = () => {
  if (!logoutArmed.value) {
    logoutArmed.value = true
    if (logoutTimer) window.clearTimeout(logoutTimer)
    logoutTimer = window.setTimeout(() => {
      logoutArmed.value = false
    }, 2500)
    return
  }
  resetLogoutArm()
  store.logout()
  closeMenu()
  router.push('/login')
}
const handleOutsideClick = (event: MouseEvent) => {
  if (!notifOpen.value) return
  const target = event.target as Node | null
  if (notifRef.value && target && !notifRef.value.contains(target)) notifOpen.value = false
}

const links = computed(() => [
  { to: '/app/dashboard', label: 'Inicio', icon: LayoutDashboard },
  ...(store.canScheduleAppointments ? [{ to: '/app/agendar-cita', label: 'Agendar cita', icon: CalendarDays }] : []),
  { to: '/app/calendario', label: 'Citas', icon: CalendarClock },
  { to: '/app/historial', label: 'Historial', icon: ClipboardList },
  ...(store.canViewPatientsList ? [{ to: '/app/pacientes', label: 'Pacientes', icon: UsersRound }] : []),
  { to: '/app/perfil', label: 'Perfil', icon: CircleUserRound },
  ...(store.canManageDoctors
    ? [
        { to: '/app/registrar-medico', label: 'Medicos', icon: Stethoscope },
        { to: '/app/configuracion', label: 'Configuracion', icon: Settings },
        { to: '/app/chatbot-config', label: 'Chatbot', icon: MessageSquare },
      ]
    : []),
])

const toRad = (deg: number) => (deg * Math.PI) / 180

const angleSpread = (count: number, startDeg: number, endDeg: number) => {
  if (count <= 1) return [(startDeg + endDeg) / 2]
  const step = (endDeg - startDeg) / (count - 1)
  return Array.from({ length: count }, (_, i) => startDeg + step * i)
}

const radialItems = computed(() => {
  const firstLayerCount = Math.min(6, links.value.length)
  const firstAngles = angleSpread(firstLayerCount, 12, 168)
  const firstRadius = 260
  const secondRadius = firstRadius * 1.3

  const firstLayer = links.value.slice(0, firstLayerCount).map((link, i) => {
    const a = toRad(firstAngles[i])
    const x = Math.cos(a) * firstRadius
    const y = Math.sin(a) * firstRadius
    return {
      to: link.to,
      link,
      x: `${x}px`,
      y: `${y}px`,
      xSoft: `${x * 0.72}px`,
      ySoft: `${y * 0.62}px`,
      scale: 1,
      delay: `${0.16 + i * 0.06}s`,
      angle: firstAngles[i],
    }
  })

  const extras = links.value.slice(firstLayerCount)
  if (!extras.length) return firstLayer

  const gapAngles = firstAngles.slice(0, -1).map((angle, i) => (angle + firstAngles[i + 1]) / 2)
  const secondLayer = extras.map((link, i) => {
    const fallbackAngles = angleSpread(extras.length, 18, 162)
    const pickedAngle = gapAngles[i] ?? fallbackAngles[i]
    const a = toRad(pickedAngle)
    const x = Math.cos(a) * secondRadius
    const y = Math.sin(a) * secondRadius
    return {
      to: link.to,
      link,
      x: `${x}px`,
      y: `${y}px`,
      xSoft: `${x * 0.72}px`,
      ySoft: `${y * 0.62}px`,
      scale: 0.92,
      delay: `${0.22 + i * 0.07}s`,
    }
  })

  return [...firstLayer, ...secondLayer]
})

let sseSource: EventSource | undefined

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
  
  const apiBase = () => import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
  sseSource = new EventSource(`${apiBase()}/api/clinic/qr-scan-stream`)
  sseSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data && data.appointmentId) {
        router.push({ path: '/app/detalle-cita', query: { id: data.appointmentId } })
      }
    } catch (err) {
      console.error('[SSE] Error processing QR scan message:', err)
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
  if (sseSource) {
    sseSource.close()
  }
})
</script>

<style scoped>
.layout {
  min-height: 100vh;
  padding: 12px 14px 14px;
}

.topbar {
  position: sticky;
  top: 6px;
  z-index: 30;
  background: transparent;
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
.topbar-actions {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 14px;
}
.notif-wrap {
  position: relative;
}
.notif-btn {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #2c5368;
  font-weight: 700;
  font-size: 0.78rem;
  background: linear-gradient(130deg, rgba(207, 236, 248, 0.78), rgba(187, 236, 228, 0.78));
  box-shadow: 0 6px 22px rgba(17, 58, 85, 0.16);
}
.notif-btn b {
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  color: #fff;
  background: #cc5a6f;
}
.notif-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: min(320px, 78vw);
  border-radius: 10px;
  border: 1px solid rgba(120, 160, 188, 0.35);
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 12px 24px rgba(25, 56, 76, 0.16);
  padding: 10px;
  z-index: 20;
}
.notif-title {
  margin: 0 0 8px;
  font-weight: 700;
  color: #244a61;
}
.notif-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}
.notif-menu li {
  border-radius: 8px;
  background: rgba(122, 181, 210, 0.14);
  padding: 8px;
}
.notif-menu li p {
  margin: 0;
  font-size: 0.82rem;
}
.notif-menu li button {
  margin-top: 6px;
  border: 0;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #fff;
  background: #3d7fa6;
  cursor: pointer;
}
.notif-empty {
  margin: 0;
  color: #688395;
  font-size: 0.82rem;
}

.menu-trigger {
  border: 0;
  background: transparent;
  color: #4b4a4a;
  font-size: 1.2rem;
  letter-spacing: 0.06em;
  font-weight: 600;
  cursor: pointer;
  text-shadow: 0 4px 20px rgba(15, 43, 63, 0.7);
}

.logout-orb {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #2c5368;
  font-weight: 700;
  font-size: 0.78rem;
  background: linear-gradient(130deg, rgba(200, 230, 243, 0.7), rgba(183, 232, 224, 0.72));
  box-shadow: 0 6px 22px rgba(17, 58, 85, 0.16);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.logout-orb:hover {
  transform: scale(1.02);
}
.logout-orb.armed {
  color: #fff;
  background: linear-gradient(130deg, #c55c6a, #d77a84);
  box-shadow: 0 8px 24px rgba(160, 64, 78, 0.28);
}

.content {
  max-width: 1280px;
  margin: 10px auto 0;
}

.radial-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: radial-gradient(circle, rgba(19, 52, 76, 0.2), rgba(11, 29, 41, 0.66));
}

.core-circle {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, -50%);
  width: min(54vw, 420px);
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  background: rgba(151, 160, 170, 0.58);
  color: #f6fbff;
  display: grid;
  place-items: center;
  text-align: center;
  box-shadow: 0 26px 60px rgba(13, 30, 42, 0.28);
  overflow: hidden;
  animation: coreIn 0.28s ease-out both;
  cursor: pointer;
}

.core-logo {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #e8f6ff;
  opacity: 0.14;
  pointer-events: none;
  transform: translateY(75px);
}

.core-visible-content {
  display: grid;
  place-items: center;
  width: 100%;
  padding-top: 46%;
}

.clinic-title {
  margin: 125px 0 0 10px;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 600;
}

.orbit-item {
  position: absolute;
  left: 50%;
  top: 0;
  z-index: 5;
  width: 85px;
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  color: #eff8ff;
  background: linear-gradient(155deg, rgba(78, 140, 180, 0.96), rgba(93, 176, 169, 0.95));
  box-shadow: 0 14px 30px rgba(17, 58, 85, 0.28);
  display: grid;
  place-items: center;
  gap: 3px;
  font-size: 0.7rem;
  font-weight: 700;
  text-align: center;
  padding: 18px;
  transform: translate(-50%, -50%) scale(0.35);
  opacity: 0;
  animation: arcOut 2.5s cubic-bezier(0.30, 1, 0.3, 1) forwards;
  animation-delay: var(--delay);
}

.orbit-item span {
  line-height: 1.1;
}

.orbit-item:hover {
  filter: brightness(1.06);
}

.orbit-item.router-link-active {
  background: linear-gradient(155deg, rgba(55, 112, 156, 1), rgba(67, 148, 142, 1));
}

.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.28s ease;
}

.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}

@keyframes arcOut {
  0% {
    transform: translate(-50%, -50%) scale(0.35);
    opacity: 0;
  }
  100% {
    transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(var(--scale));
    opacity: 1;
  }
}

@keyframes coreIn {
  from {
    transform: translate(-50%, -56%) scale(0.84);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .core-circle {
    width: min(68vw, 360px);
  }
  .orbit-item {
    width: 88px;
    font-size: 0.66rem;
  }
}

@media (max-width: 640px) {
  .menu-trigger {
    color: #f4fbff;
  }
  .topbar-actions {
    right: 4px;
    gap: 10px;
  }
  .notif-btn,
  .logout-orb {
    padding: 7px 10px;
    font-size: 0.72rem;
  }
  .core-circle {
    width: min(80vw, 320px);
  }
  .orbit-item {
    width: 78px;
    font-size: 0.62rem;
  }
}
</style>
