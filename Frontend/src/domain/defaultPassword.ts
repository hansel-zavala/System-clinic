import type { UserRole } from './types'

/** Contraseña por defecto en demo cuando el usuario no tiene campo `password`. */
export function defaultPasswordByRole(role: UserRole): string {
  if (role === 'admin') return 'Admin123!'
  if (role === 'medico') return 'Medico123!'
  return 'Paciente123!'
}
