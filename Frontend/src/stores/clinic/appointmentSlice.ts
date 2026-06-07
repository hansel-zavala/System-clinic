import { addDays, format } from 'date-fns'
import { computed, type ComputedRef, type Ref } from 'vue'
import { formatDateTimeShort } from '../../domain/datetimeDisplay'
import { countAppointmentsByMonth, countRegistrationsByMonth } from '@/domain/dashboardSeries'
import type {
  Appointment,
  AppointmentStatus,
  AppointmentView,
  Consultorio,
  CreateAppointmentPayload,
  DuracionOpcion,
  MotivoConsultaItem,
  NotificationItem,
  Patient,
  UserProfile,
  UserRole,
} from '../../domain/types'
import { enrichAppointment } from '../../domain/clinicJoins'
import { persistClinicTables } from '../../data/repositories/clinicRepository'
import { newNumericId } from '../../domain/generateId'

export function createAppointmentSlice(deps: {
  appointments: Ref<Appointment[]>
  patients: Ref<Patient[]>
  users: Ref<UserProfile[]>
  consultorios: Ref<Consultorio[]>
  motivosConsulta: Ref<MotivoConsultaItem[]>
  duracionesOpcion: Ref<DuracionOpcion[]>
  currentUser: Ref<UserProfile>
  currentRole: Ref<UserRole>
  doctors: ComputedRef<UserProfile[]>
  pushNotification: (n: NotificationItem) => Promise<void>
}) {
  const {
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
  } = deps

  const roleScopedAppointments = computed((): Appointment[] => {
    if (currentRole.value === 'admin') return appointments.value
    if (currentRole.value === 'medico') {
      return appointments.value.filter((item) => item.medicoUserId === currentUser.value.id)
    }
    const patient = patients.value.find((item) => item.userId === currentUser.value.id)
    return patient ? appointments.value.filter((item) => item.pacienteId === patient.id) : []
  })

  const todaysAppointments = computed(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return roleScopedAppointments.value
      .filter((item) => format(new Date(item.fechaISO), 'yyyy-MM-dd') === today)
      .map((a) => enrichAppointment(a, users.value, patients.value, consultorios.value))
  })

  const appointmentsByStatus = (status: AppointmentStatus) =>
    roleScopedAppointments.value.filter((item) => item.estado === status).length

  const roleVisibleAppointments = computed((): AppointmentView[] =>
    roleScopedAppointments.value.map((a) =>
      enrichAppointment(a, users.value, patients.value, consultorios.value),
    ),
  )

  const createAppointment = async (payload: CreateAppointmentPayload) => {
    if (currentRole.value === 'paciente') {
      if (import.meta.env.DEV) {
        console.warn('[appointments] Los pacientes no pueden registrar citas en el sistema.')
      }
      return
    }
    const patient = patients.value.find((item) => item.id === payload.pacienteId)
    const doctor = doctors.value.find((item) => item.id === payload.medicoUserId)
    if (!patient || !doctor) return

    const motivoOk = motivosConsulta.value.some((m) => m.codigo === payload.motivo && m.activo)
    const durOk = duracionesOpcion.value.some((d) => d.minutos === payload.duracionMin && d.activo)
    if (!motivoOk || !durOk) {
      if (import.meta.env.DEV) {
        console.warn('[appointments] Motivo o duración no válidos según catálogo activo.')
      }
      return
    }

    const newAppointment: Appointment = {
      id: newNumericId(),
      pacienteId: patient.id,
      medicoUserId: doctor.id,
      consultorioId: payload.consultorioId,
      fechaISO: payload.fechaISO,
      duracionMin: payload.duracionMin,
      motivo: payload.motivo,
      estado: 'pendiente',
      notas: payload.notas,
    }

    appointments.value.unshift(newAppointment)
    await persistClinicTables({ appointments: appointments.value })

    const patientUser = users.value.find((u) => u.id === patient.userId)
    const patientLabel = patientUser?.nombre ?? 'Paciente'

    await pushNotification({
      id: newNumericId(),
      userId: patient.userId,
      appointmentId: newAppointment.id,
      mensaje: `Cita registrada para ${patientLabel} el ${formatDateTimeShort(newAppointment.fechaISO)}.`,
      fechaISO: new Date().toISOString(),
      leida: false,
    })
    if (doctor.id !== patient.userId) {
      await pushNotification({
        id: newNumericId(),
        userId: doctor.id,
        appointmentId: newAppointment.id,
        mensaje: `Nueva cita asignada: ${patientLabel} el ${formatDateTimeShort(newAppointment.fechaISO)}.`,
        fechaISO: new Date().toISOString(),
        leida: false,
      })
    }
  }

  const cancelAppointment = async (appointmentId: string) => {
    const appointment = appointments.value.find((item) => item.id === appointmentId)
    if (!appointment) return
    appointment.estado = 'cancelada'
    await persistClinicTables({ appointments: appointments.value })
    const view = enrichAppointment(appointment, users.value, patients.value, consultorios.value)
    const patientUid = patients.value.find((item) => item.id === appointment.pacienteId)?.userId
    if (patientUid) {
      await pushNotification({
        id: newNumericId(),
        userId: patientUid,
        appointmentId,
        mensaje: `La cita de ${view.pacienteNombre} fue cancelada.`,
        fechaISO: new Date().toISOString(),
        leida: false,
      })
    }
    if (appointment.medicoUserId && appointment.medicoUserId !== patientUid) {
      await pushNotification({
        id: newNumericId(),
        userId: appointment.medicoUserId,
        appointmentId,
        mensaje: `Cita cancelada: ${view.pacienteNombre}.`,
        fechaISO: new Date().toISOString(),
        leida: false,
      })
    }
  }

  const rescheduleAppointment = async (appointmentId: string) => {
    const appointment = appointments.value.find((item) => item.id === appointmentId)
    if (!appointment) return
    appointment.fechaISO = addDays(new Date(appointment.fechaISO), 1).toISOString()
    appointment.estado = 'pendiente'
    await persistClinicTables({ appointments: appointments.value })
    const view = enrichAppointment(appointment, users.value, patients.value, consultorios.value)
    const patientUid = patients.value.find((item) => item.id === appointment.pacienteId)?.userId
    if (patientUid) {
      await pushNotification({
        id: newNumericId(),
        userId: patientUid,
        appointmentId,
        mensaje: `Tu cita fue reagendada para ${formatDateTimeShort(appointment.fechaISO)}.`,
        fechaISO: new Date().toISOString(),
        leida: false,
      })
    }
    if (appointment.medicoUserId && appointment.medicoUserId !== patientUid) {
      await pushNotification({
        id: newNumericId(),
        userId: appointment.medicoUserId,
        appointmentId,
        mensaje: `Cita de ${view.pacienteNombre} reagendada a ${formatDateTimeShort(appointment.fechaISO)}.`,
        fechaISO: new Date().toISOString(),
        leida: false,
      })
    }
  }

  const chartDataByMonth = computed(() =>
    countAppointmentsByMonth(roleScopedAppointments.value.map((a) => a.fechaISO)),
  )

  const newPatientsByMonth = computed(() =>
    countRegistrationsByMonth(patients.value.map((p) => p.fechaRegistro)),
  )

  return {
    roleScopedAppointments,
    todaysAppointments,
    appointmentsByStatus,
    roleVisibleAppointments,
    createAppointment,
    cancelAppointment,
    rescheduleAppointment,
    chartDataByMonth,
    newPatientsByMonth,
  }
}
