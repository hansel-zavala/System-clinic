import type { Ref } from 'vue'
import type { UserProfile } from '../../domain/types'
import { persistClinicTables } from '../../data/repositories/clinicRepository'
import { defaultPasswordByRole } from '../../domain/defaultPassword'

/** Asigna contraseña por defecto a usuarios legacy sin campo password. */
export async function ensurePasswordMigration(users: Ref<UserProfile[]>) {
  let changed = false
  users.value = users.value.map((user) => {
    if (user.password) return user
    // Si el backend informa que la contraseña ya existe en BD, no la toques.
    // Solo migra cuando explícitamente `password_hash` es null/vacío.
    if (user.hasPasswordHash === false) {
      changed = true
      return { ...user, password: defaultPasswordByRole(user.rol) }
    }
    return user
  })
  if (changed) await persistClinicTables({ users: users.value })
}