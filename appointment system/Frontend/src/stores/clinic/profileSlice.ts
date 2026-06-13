import type { Ref } from 'vue'
import { ageFromBirthDate } from '../../domain/ageFromBirth'
import type { Patient, UserProfile, UserRole } from '../../domain/types'
import { persistClinicTables } from '../../data/repositories/clinicRepository'
import { changePasswordWithBackendApi, uploadProfilePhotoWithBackendApi } from '../../data/authApi'
import { ACCESO_NO_AUTORIZADO } from '../../domain/messages'

export function createProfileSlice(deps: {
  users: Ref<UserProfile[]>
  patients: Ref<Patient[]>
  currentUser: Ref<UserProfile>
  currentRole: Ref<UserRole>
  syncPatientAllergiesFromPlainText: (patientId: string, text: string) => Promise<void>
  syncPatientMedicationsFromPlainText: (patientId: string, text: string) => Promise<void>
}) {
  const {
    users,
    patients,
    currentUser,
    currentRole,
    syncPatientAllergiesFromPlainText,
    syncPatientMedicationsFromPlainText,
  } = deps

  const updateCurrentUserProfile = async (payload: Partial<UserProfile>) => {
    const idx = users.value.findIndex((item) => item.id === currentUser.value.id)
    if (idx < 0) return { ok: false, message: 'Usuario no encontrado.' }

    const merge: Partial<UserProfile> = { ...payload }
    delete merge.correo
    if (currentRole.value === 'paciente') {
      delete merge.firmaDigital
    }

    users.value[idx] = {
      ...users.value[idx],
      ...merge,
      id: users.value[idx].id,
      rol: users.value[idx].rol,
      correo: users.value[idx].correo,
    }
    currentUser.value = users.value[idx]
    await persistClinicTables({ users: users.value })
    return { ok: true, message: 'Perfil actualizado correctamente.' }
  }

  const updateCurrentPatientProfile = async (payload: Partial<Patient>) => {
    const idx = patients.value.findIndex((item) => item.userId === currentUser.value.id)
    if (idx < 0) return { ok: false, message: 'Este usuario no tiene ficha de paciente.' }

    const previous = patients.value[idx]
    const merged: Patient = {
      ...previous,
      ...payload,
      id: previous.id,
      userId: previous.userId,
      direccion: {
        ...previous.direccion,
        ...(payload.direccion ?? {}),
      },
    }
    if (merged.fechaNacimiento) {
      merged.edad = ageFromBirthDate(merged.fechaNacimiento)
    }
    patients.value[idx] = merged
    await persistClinicTables({ patients: patients.value })
    return { ok: true, message: 'Ficha de paciente actualizada.' }
  }

  const updatePatientByAdmin = async (payload: {
    patientId: string
    userPatch: { nombre: string }
    patientPatch: Partial<
      Pick<Patient, 'edad' | 'telefono' | 'genero' | 'tipoSangre' | 'notasMedico' | 'fechaNacimiento'>
    > & { direccion?: Partial<Patient['direccion']> }
    allergiesText: string
    medicationsText: string
  }) => {
    if (currentRole.value !== 'admin') {
      return { ok: false, message: ACCESO_NO_AUTORIZADO }
    }

    const idx = patients.value.findIndex((item) => item.id === payload.patientId)
    if (idx < 0) return { ok: false, message: 'Paciente no encontrado.' }

    const previous = patients.value[idx]
    const merged: Patient = {
      ...previous,
      ...payload.patientPatch,
      id: previous.id,
      userId: previous.userId,
      direccion: {
        ...previous.direccion,
        ...(payload.patientPatch.direccion ?? {}),
      },
    }
    if (merged.fechaNacimiento) {
      merged.edad = ageFromBirthDate(merged.fechaNacimiento)
    }
    patients.value[idx] = merged

    const userIdx = users.value.findIndex((item) => item.id === previous.userId)
    if (userIdx >= 0) {
      users.value[userIdx] = {
        ...users.value[userIdx],
        nombre: payload.userPatch.nombre.trim(),
      }
      if (currentUser.value.id === users.value[userIdx].id) {
        currentUser.value = users.value[userIdx]
      }
    }

    await syncPatientAllergiesFromPlainText(payload.patientId, payload.allergiesText)
    await syncPatientMedicationsFromPlainText(payload.patientId, payload.medicationsText)

    await persistClinicTables({ patients: patients.value, users: users.value })
    return { ok: true, message: 'Paciente actualizado correctamente.' }
  }

  const regenerateProfileAvatar = () => {
    const avatar = `https://i.pravatar.cc/180?img=${Math.floor(Math.random() * 70) + 1}`
    return updateCurrentUserProfile({ fotoUrl: avatar })
  }

  /** Sube imagen a Supabase Storage vía backend; actualiza BD y el estado local (sin PATCH masivo). */
  const uploadProfilePhoto = async (file: File) => {
    const api = await uploadProfilePhotoWithBackendApi({
      userId: currentUser.value.id,
      file,
    })
    if (!api.ok || !api.user) {
      return { ok: false, message: api.message }
    }
    const merged = api.user
    const idx = users.value.findIndex((item) => item.id === merged.id)
    if (idx >= 0) {
      users.value[idx] = merged
    }
    currentUser.value = merged
    return { ok: true, message: api.message }
  }

  const changeCurrentUserPassword = async (payload: { currentPass: string; newPass: string; confirmPass: string }) => {
    if (!payload.currentPass || !payload.newPass || !payload.confirmPass) {
      return { ok: false, message: 'Completa todos los campos de seguridad.' }
    }
    if (payload.newPass.length < 6) {
      return { ok: false, message: 'La nueva contrasena debe tener al menos 6 caracteres.' }
    }
    if (payload.newPass !== payload.confirmPass) {
      return { ok: false, message: 'La confirmacion no coincide.' }
    }
    const uid = currentUser.value.id
    const api = await changePasswordWithBackendApi({
      userId: uid,
      currentPassword: payload.currentPass,
      newPassword: payload.newPass,
    })
    if (!api.ok) {
      return { ok: false, message: api.message }
    }
    return { ok: true, message: api.message }
  }

  return {
    updateCurrentUserProfile,
    updateCurrentPatientProfile,
    updatePatientByAdmin,
    regenerateProfileAvatar,
    uploadProfilePhoto,
    changeCurrentUserPassword,
  }
}
