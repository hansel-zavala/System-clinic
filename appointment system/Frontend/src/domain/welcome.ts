import type { Patient, UserRole } from './types'

/** Partícula de bienvenida según género registrado (paciente). */
export function welcomeParticlePatient(genero: Patient['genero'] | undefined): string {
  if (genero === 'F') return 'Bienvenida'
  if (genero === 'M') return 'Bienvenido'
  return 'Bienvenid@'
}

/** Forma inclusiva para roles sin ficha de género (admin / médico). */
export function welcomeParticleStaff(): string {
  return 'Bienvenid@'
}

/** Kicker corto según rol (encima del saludo en el dashboard). */
export function welcomeKickerForRole(role: UserRole): string {
  if (role === 'admin') return 'Administración'
  if (role === 'medico') return 'Equipo clínico'
  return 'Tu bienestar'
}

/**
 * Línea principal de bienvenida: tono distinto por rol (paciente / médico / admin).
 */
export function welcomeDashboardLine(args: {
  role: UserRole
  firstName: string
  patientGenero: Patient['genero'] | undefined
}): string {
  const { role, firstName, patientGenero } = args
  const n = firstName.trim()
  if (!n) return ''

  if (role === 'admin') {
    return `Hola, ${n}. ${welcomeParticleStaff()} al centro de control de Clínica Aura: aquí coordinas el equipo, la agenda y los parámetros de operación.`
  }
  if (role === 'medico') {
    return `Hola, ${n}. ${welcomeParticleStaff()} a tu espacio de agenda y atención: revisa citas, historial y el ritmo de tu jornada clínica.`
  }
  const w = welcomeParticlePatient(patientGenero)
  return `Hola, ${n}. ${w} a tu área personal: aquí verás tus próximas citas, avisos y el seguimiento de tu salud.`
}
