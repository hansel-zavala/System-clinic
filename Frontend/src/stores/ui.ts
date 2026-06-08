import { computed } from 'vue'
import { defineStore } from 'pinia'
import { createAuthSlice } from './clinic/authSlice'
import { createAppointmentSlice } from './clinic/appointmentSlice'
import { createInitialRefs } from './clinic/initialRefs'
import { createNotificationActions } from './clinic/notificationSlice'
import { ensurePasswordMigration } from './clinic/passwordMigration'
import { createFilteredPatients, createPatientHelpers } from './clinic/patientSlice'
import { createProfileSlice } from './clinic/profileSlice'
import { createRegistrationSlice } from './clinic/registrationSlice'

export const useClinicUiStore = defineStore('clinic-ui', () => {
  const refs = createInitialRefs()
  const {
    search,
    selectedGender,
    users,
    patients,
    appointments,
    notifications,
    consultorios,
    motivosConsulta,
    duracionesOpcion,
    allergenCatalog,
    medicationCatalog,
    patientAllergies,
    patientMedications,
  } = refs

  void ensurePasswordMigration(users).catch((err) => console.error('[clinic] migración de contraseñas:', err))

  const auth = createAuthSlice(users)
  const { currentUser, currentRole, isAuthenticated, loginWithCredentials, logout } = auth

  const patientHelpers = createPatientHelpers(
    users,
    patientAllergies,
    allergenCatalog,
    patientMedications,
    medicationCatalog,
  )

  const filteredPatients = createFilteredPatients(
    patients,
    search,
    selectedGender,
    patientHelpers.patientDisplayName,
    patientHelpers.patientDisplayEmail,
  )

  const emailExists = (email: string) => users.value.some((item) => item.correo.toLowerCase() === email.toLowerCase())

  const doctors = computed(() => users.value.filter((item) => item.rol === 'medico'))
  const consultoriosActivos = computed(() => (consultorios.value ?? []).filter((c) => c.activo))
  const motivosConsultaActivos = computed(() => (motivosConsulta.value ?? []).filter((m) => m.activo))
  const duracionesOpcionActivas = computed(() =>
    [...(duracionesOpcion.value ?? [])]
      .filter((d) => d.activo)
      .sort((a, b) => a.minutos - b.minutos),
  )
  const canManageDoctors = computed(() => currentRole.value === 'admin')
  const canScheduleAppointments = computed(
    () => currentRole.value === 'admin' || currentRole.value === 'medico',
  )
  /** Lista de pacientes: solo administración y médicos. */
  const canViewPatientsList = computed(
    () => currentRole.value === 'admin' || currentRole.value === 'medico',
  )
  const currentPatientRecord = computed(
    () => patients.value.find((item) => item.userId === currentUser.value.id) ?? null,
  )

  const { pushNotification, markNotificationRead } = createNotificationActions(notifications, currentUser)

  /** Solo notificaciones cuyo destinatario es el usuario de la sesión actual. */
  const notificationsForCurrentUser = computed(() =>
    notifications.value.filter((item) => item.userId === currentUser.value.id),
  )

  const appointmentApi = createAppointmentSlice({
    appointments,
    patients,
    users,
    consultorios,
    motivosConsulta,
    duracionesOpcion,
    currentUser,
    currentRole,
    doctors,
    pushNotification,
  })

  const registrationApi = createRegistrationSlice({
    users,
    patients,
    emailExists,
    canManageDoctors,
  })

  const profileApi = createProfileSlice({
    users,
    patients,
    currentUser,
    currentRole,
    syncPatientAllergiesFromPlainText: patientHelpers.syncPatientAllergiesFromPlainText,
    syncPatientMedicationsFromPlainText: patientHelpers.syncPatientMedicationsFromPlainText,
  })

  return {
    allergenCatalog,
    appointments,
    appointmentsByStatus: appointmentApi.appointmentsByStatus,
    chartDataByMonth: appointmentApi.chartDataByMonth,
    canManageDoctors,
    canScheduleAppointments,
    canViewPatientsList,
    changeCurrentUserPassword: profileApi.changeCurrentUserPassword,
    consultorios,
    consultoriosActivos,
    motivosConsulta,
    duracionesOpcion,
    motivosConsultaActivos,
    duracionesOpcionActivas,
    createAppointment: appointmentApi.createAppointment,
    currentRole,
    currentPatientRecord,
    currentUser,
    doctors,
    filteredPatients,
    isAuthenticated,
    loginWithCredentials,
    logout,
    markNotificationRead,
    notificationsForCurrentUser,
    medicationCatalog,
    newPatientsByMonth: appointmentApi.newPatientsByMonth,
    notifications,
    patientAllergies,
    patientAllergiesLine: patientHelpers.patientAllergiesLine,
    patientDisplayEmail: patientHelpers.patientDisplayEmail,
    patientDisplayName: patientHelpers.patientDisplayName,
    patientMedications,
    patientMedicationsLine: patientHelpers.patientMedicationsLine,
    patients,
    regenerateProfileAvatar: profileApi.regenerateProfileAvatar,
    uploadProfilePhoto: profileApi.uploadProfilePhoto,
    registerDoctorByAdmin: registrationApi.registerDoctorByAdmin,
    registerPatientAccount: registrationApi.registerPatientAccount,
    cancelAppointment: appointmentApi.cancelAppointment,
    rescheduleAppointment: appointmentApi.rescheduleAppointment,
    confirmAppointment: appointmentApi.confirmAppointment,
    rejectAppointment: appointmentApi.rejectAppointment,
    completeAppointment: appointmentApi.completeAppointment,
    roleVisibleAppointments: appointmentApi.roleVisibleAppointments,
    search,
    selectedGender,
    syncPatientAllergiesFromPlainText: patientHelpers.syncPatientAllergiesFromPlainText,
    syncPatientMedicationsFromPlainText: patientHelpers.syncPatientMedicationsFromPlainText,
    todaysAppointments: appointmentApi.todaysAppointments,
    updatePatientByAdmin: profileApi.updatePatientByAdmin,
    updateCurrentPatientProfile: profileApi.updateCurrentPatientProfile,
    updateCurrentUserProfile: profileApi.updateCurrentUserProfile,
    users,
  }
})
