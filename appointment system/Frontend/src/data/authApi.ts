import type { UserProfile } from '../domain/types'

const apiBase = () => import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export async function loginWithBackendApi(correo: string, password: string): Promise<{
  ok: boolean
  message: string
  user?: UserProfile
}> {
  const res = await fetch(`${apiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: correo.trim(), password }),
  })
  const data = (await res.json()) as { ok?: boolean; message?: string; user?: UserProfile }
  if (!res.ok) {
    return { ok: false, message: data.message ?? `Error ${res.status}` }
  }
  if (!data.user) {
    return { ok: false, message: 'Respuesta inválida del servidor.' }
  }
  return { ok: true, message: data.message ?? 'Sesión iniciada correctamente.', user: data.user }
}

export async function changePasswordWithBackendApi(payload: {
  userId: string
  currentPassword: string
  newPassword: string
}): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${apiBase()}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await res.json()) as { ok?: boolean; message?: string }
  if (!res.ok) {
    return { ok: false, message: data.message ?? `Error ${res.status}` }
  }
  return { ok: true, message: data.message ?? 'Contraseña actualizada correctamente.' }
}

export async function uploadProfilePhotoWithBackendApi(payload: {
  userId: string
  file: File
}): Promise<{ ok: boolean; message: string; fotoUrl?: string; user?: UserProfile }> {
  const fd = new FormData()
  fd.append('userId', payload.userId)
  fd.append('file', payload.file)
  const res = await fetch(`${apiBase()}/api/auth/profile-photo`, {
    method: 'POST',
    body: fd,
  })
  const data = (await res.json()) as {
    ok?: boolean
    message?: string
    fotoUrl?: string
    user?: UserProfile
  }
  if (!res.ok) {
    return { ok: false, message: data.message ?? `Error ${res.status}` }
  }
  if (!data.ok || !data.user) {
    return { ok: false, message: data.message ?? 'Respuesta inválida del servidor.' }
  }
  return {
    ok: true,
    message: data.message ?? 'Foto de perfil actualizada.',
    fotoUrl: data.fotoUrl,
    user: data.user,
  }
}
