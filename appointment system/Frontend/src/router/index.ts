import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import type { UserRole } from '../domain/types'
import { AUTH_SESSION_KEY } from '../data/authSession'
import { useClinicUiStore } from '../stores/ui'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: () => import('../views/AuthGatewayView.vue') },
    { path: '/register', name: 'register', component: () => import('../views/AuthGatewayView.vue') },
    {
      path: '/app',
      component: () => import('../components/layout/ClinicLayout.vue'),
      children: [
        { path: '', redirect: '/app/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
        {
          path: 'pacientes',
          name: 'pacientes',
          meta: { roles: ['admin', 'medico'] satisfies UserRole[] },
          component: () => import('../views/PatientsListView.vue'),
        },
        {
          path: 'agendar-cita',
          name: 'agendar-cita',
          meta: { roles: ['admin', 'medico'] satisfies UserRole[] },
          component: () => import('../views/ScheduleAppointmentView.vue'),
        },
        { path: 'perfil', name: 'perfil', component: () => import('../views/UserProfileView.vue') },
        { path: 'calendario', name: 'calendario', component: () => import('../views/CalendarView.vue') },
        { path: 'detalle-cita', name: 'detalle-cita', component: () => import('../views/AppointmentDetailView.vue') },
        { path: 'historial', name: 'historial', component: () => import('../views/PatientHistoryView.vue') },
        {
          path: 'registrar-medico',
          name: 'registrar-medico',
          meta: { roles: ['admin'] satisfies UserRole[] },
          component: () => import('../views/AdminDoctorRegisterView.vue'),
        },
        {
          path: 'configuracion',
          name: 'configuracion',
          meta: { roles: ['admin'] satisfies UserRole[] },
          component: () => import('../views/SystemSettingsView.vue'),
        },
        {
          path: 'acceso-no-autorizado',
          name: 'acceso-no-autorizado',
          component: () => import('../views/AccessDeniedView.vue'),
        },
      ],
    },
    { path: '/dashboard', redirect: '/app/dashboard' },
    { path: '/pacientes', redirect: '/app/pacientes' },
    { path: '/agendar-cita', redirect: '/app/agendar-cita' },
    { path: '/perfil', redirect: '/app/perfil' },
    { path: '/calendario', redirect: '/app/calendario' },
    { path: '/detalle-cita', redirect: '/app/detalle-cita' },
    { path: '/historial', redirect: '/app/historial' },
    { path: '/registrar-medico', redirect: '/app/registrar-medico' },
    { path: '/configuracion', redirect: '/app/configuracion' },
  ],
})

router.beforeEach((to: RouteLocationNormalized) => {
  const hasSession = Boolean(localStorage.getItem(AUTH_SESSION_KEY))
  if (to.path.startsWith('/app') && !hasSession) return '/login'
  if ((to.path === '/login' || to.path === '/register') && hasSession) return '/app/dashboard'

  const required = to.meta.roles
  if (hasSession && to.path.startsWith('/app') && required?.length) {
    const store = useClinicUiStore()
    if (!required.includes(store.currentRole)) {
      return { name: 'acceso-no-autorizado' }
    }
  }
  return true
})

export default router
