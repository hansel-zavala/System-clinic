import { format } from 'date-fns'
import type { ComputedRef, Ref } from 'vue'
import { ageFromBirthDate, isValidBirthDateForRegistration } from '../../domain/ageFromBirth'
import { defaultPasswordByRole } from '../../domain/defaultPassword'
import type { Patient, UserProfile } from '../../domain/types'
import { persistClinicTables } from '../../data/repositories/clinicRepository'
import { newNumericId } from '../../domain/generateId'
import { ACCESO_NO_AUTORIZADO } from '../../domain/messages'
import { isCompletePhoneCr, parsePhoneDigits } from '../../domain/phoneCr'

export function createRegistrationSlice(deps: {
  users: Ref<UserProfile[]>
  patients: Ref<Patient[]>
  emailExists: (email: string) => boolean
  canManageDoctors: ComputedRef<boolean>
}) {
  const { users, patients, emailExists, canManageDoctors } = deps

  const registerPatientAccount = async (payload: {
    nombre: string
    correo: string
    password: string
    telefono: string
    fechaNacimiento: string
    genero: 'F' | 'M' | 'Otro'
  }) => {
    const correoNorm = payload.correo.trim().toLowerCase()
    if (emailExists(correoNorm)) {
      return { ok: false, message: 'El email ya esta registrado.' }
    }
    if (!payload.fechaNacimiento?.trim()) {
      return { ok: false, message: 'Indica tu fecha de nacimiento.' }
    }
    if (!isValidBirthDateForRegistration(payload.fechaNacimiento.trim())) {
      return { ok: false, message: 'La fecha de nacimiento no es valida.' }
    }

    const tel = parsePhoneDigits(payload.telefono)
    if (!isCompletePhoneCr(tel)) {
      return { ok: false, message: 'El telefono debe tener 8 digitos (formato 0000-0000).' }
    }

    const fechaNacimiento = payload.fechaNacimiento.trim()
    const edad = ageFromBirthDate(fechaNacimiento)

    const userId = newNumericId()
    const patientId = newNumericId()

    users.value.unshift({
      id: userId,
      nombre: payload.nombre,
      correo: correoNorm,
      password: payload.password || defaultPasswordByRole('paciente'),
      rol: 'paciente',
      fotoUrl: 'https://i.pravatar.cc/180?img=24',
      firmaDigital: payload.nombre
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join(''),
    })

    patients.value.unshift({
      id: patientId,
      userId,
      fechaNacimiento,
      fechaRegistro: format(new Date(), 'yyyy-MM-dd'),
      edad,
      telefono: tel,
      genero: payload.genero,
      direccion: { calle: '', ciudad: '' },
      tipoSangre: '',
      notasMedico: '',
    })

    await persistClinicTables({ users: users.value, patients: patients.value })
    return { ok: true, message: 'Paciente registrado correctamente.' }
  }

  const registerDoctorByAdmin = async (payload: {
    nombre: string
    correo: string
    password: string
    especialidad: string
    horarioDisponible: string
  }) => {
    if (!canManageDoctors.value) {
      return { ok: false, message: ACCESO_NO_AUTORIZADO }
    }
    const password = payload.password.trim()
    if (!password) {
      return { ok: false, message: 'La contrasena es obligatoria.' }
    }
    if (password.length < 6) {
      return { ok: false, message: 'La contrasena debe tener al menos 6 caracteres.' }
    }
    const correoDoc = payload.correo.trim().toLowerCase()
    if (emailExists(correoDoc)) {
      return { ok: false, message: 'El email ya esta registrado.' }
    }

    users.value.unshift({
      id: newNumericId(),
      nombre: payload.nombre,
      correo: correoDoc,
      password,
      rol: 'medico',
      especialidad: payload.especialidad,
      horarioDisponible: payload.horarioDisponible,
      fotoUrl: 'https://i.pravatar.cc/180?img=47',
      firmaDigital: payload.nombre
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join(''),
    })
    await persistClinicTables({ users: users.value })
    return { ok: true, message: 'Medico registrado correctamente.' }
  }

  return { registerPatientAccount, registerDoctorByAdmin }
}
