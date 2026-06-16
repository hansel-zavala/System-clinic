export type UserRole = 'admin' | 'medico' | 'paciente'

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'no_aceptada' | 'completada'

/** Ficha clinica: identidad (nombre/correo) solo en users via userId (3FN) */
export interface Patient {
  id: string
  userId: string
  /** ISO YYYY-MM-DD; si existe, la edad se deriva de aquí */
  fechaNacimiento?: string
  /** ISO YYYY-MM-DD; día de registro en la clínica (altas / nuevos pacientes) */
  fechaRegistro?: string
  edad: number
  telefono: string
  genero: 'F' | 'M' | 'Otro'
  direccion: {
    calle: string
    ciudad: string
  }
  tipoSangre: string
  notasMedico: string
}

/** Catálogo de motivos (persistido en BD). */
export interface MotivoConsultaItem {
  id: string
  /** Clave almacenada en citas (ej. chequeo, control). */
  codigo: string
  nombreLargo: string
  nombreCorto: string
  activo: boolean
}

/** Catálogo de duraciones en minutos (persistido en BD). */
export interface DuracionOpcion {
  id: string
  minutos: number
  activo: boolean
}

/** Cita: sin nombres duplicados; sala via consultorioId (3FN) */
export interface Appointment {
  id: string
  pacienteId: string
  medicoUserId: string
  consultorioId: string
  fechaISO: string
  duracionMin: number
  /** Código de motivo según catálogo (motivos_consulta.codigo). */
  motivo: string
  estado: AppointmentStatus
  notas: string
}

/** Payload al crear una cita desde el formulario (sin id ni estado inicial). */
export interface CreateAppointmentPayload {
  pacienteId: string
  fechaISO: string
  duracionMin: number
  motivo: string
  medicoUserId: string
  consultorioId: string
  notas: string
}

/** Proyeccion para UI (equivalente a vistas SQL) */
export interface AppointmentView extends Appointment {
  pacienteNombre: string
  medicoAsignado: string
  salaConsultorio: string
  consultorioNombre?: string
}

export interface UserProfile {
  id: string
  nombre: string
  correo: string
  password?: string
  rol: UserRole
  hasPasswordHash?: boolean
  especialidad?: string
  horarioDisponible?: string
  fotoUrl: string
  firmaDigital: string
}

export interface NotificationItem {
  id: string
  userId: string
  appointmentId: string | null
  mensaje: string
  fechaISO: string
  leida: boolean
}

export interface Consultorio {
  id: string
  codigo: string
  nombre?: string
  activo: boolean
}

export interface DoctorScheduleSlot {
  id: string
  medicoUserId: string
  weekday: number
  horaInicio: string
  horaFin: string
  activo: boolean
}

export type ClinicalEncounterStatus = 'abierto' | 'cerrado' | 'anulado'

export interface ClinicalEncounter {
  id: string
  patientId: string
  appointmentId: string | null
  medicoUserId: string
  startedAt: string
  endedAt: string | null
  estado: ClinicalEncounterStatus
}

export interface ClinicalNote {
  id: string
  encounterId: string
  autorUserId: string
  titulo?: string
  contenido: string
  createdAt: string
}

export interface AllergenCatalog {
  id: string
  nombre: string
  codigo?: string
  activo: boolean
}

export type AllergySeverity = 'leve' | 'moderada' | 'severa' | 'no_especificada'

export interface PatientAllergy {
  id: string
  patientId: string
  allergenId: string | null
  detalleLibre: string | null
  severidad: AllergySeverity
  notas: string | null
  registradoEn: string
}

export interface MedicationCatalog {
  id: string
  nombre: string
  principioActivo?: string
  activo: boolean
}

export interface PatientMedication {
  id: string
  patientId: string
  medicationId: string | null
  nombreLibre: string | null
  dosis: string | null
  frecuencia: string | null
  activo: boolean
  fechaInicio: string | null
  fechaFin: string | null
  notas: string | null
  registradoEn: string
}

export interface ChatbotSettings {
  id: string
  welcomeMessage: string
  askName: string
  askPhone: string
  askReason: string
  askSymptoms: string
  usarIa: boolean
  updatedAt: string
}
