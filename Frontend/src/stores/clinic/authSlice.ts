import { ref, watch, type Ref } from 'vue'
import type { UserProfile, UserRole } from '../../domain/types'
import { AUTH_SESSION_KEY } from '../../data/authSession'
import { loginWithBackendApi } from '../../data/authApi'
import { EMPTY_USER_NUMERIC_ID } from '../../domain/generateId'

/** Placeholder cuando la BD aún no tiene usuarios (sin datos demo). */
function emptyUserPlaceholder(): UserProfile {
  return {
    id: EMPTY_USER_NUMERIC_ID,
    nombre: '—',
    correo: '',
    rol: 'paciente',
    fotoUrl: '',
    firmaDigital: '—',
  }
}

export function createAuthSlice(users: Ref<UserProfile[]>) {
  const sessionUserId = localStorage.getItem(AUTH_SESSION_KEY)
  const sessionUser = sessionUserId ? users.value.find((item) => item.id === sessionUserId) : null
  const first = users.value[0]
  const currentUser = ref(sessionUser ?? first ?? emptyUserPlaceholder())
  const currentRole = ref<UserRole>(currentUser.value.rol)
  const isAuthenticated = ref(Boolean(sessionUser))

  watch(currentRole, (role) => {
    const byRole = users.value.find((item) => item.rol === role)
    if (byRole) currentUser.value = byRole
  })

  const loginWithCredentials = async (payload: { correo: string; password: string }) => {
    if (!payload.password) return { ok: false, message: 'Ingresa la contrasena.' }
    const result = await loginWithBackendApi(payload.correo, payload.password)
    if (!result.ok || !result.user) {
      return { ok: false, message: result.message }
    }
    const user = result.user
    const idx = users.value.findIndex((item) => item.id === user.id)
    if (idx >= 0) {
      users.value[idx] = { ...users.value[idx], ...user }
    } else {
      users.value.push(user)
    }

    currentUser.value = users.value.find((item) => item.id === user.id) ?? user
    currentRole.value = currentUser.value.rol
    isAuthenticated.value = true
    localStorage.setItem(AUTH_SESSION_KEY, user.id)
    return { ok: true, message: result.message }
  }

  const logout = () => {
    isAuthenticated.value = false
    localStorage.removeItem(AUTH_SESSION_KEY)
  }

  return {
    currentUser,
    currentRole,
    isAuthenticated,
    loginWithCredentials,
    logout,
  }
}
