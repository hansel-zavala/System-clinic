/**
 * Mapeo entre filas PostgreSQL (snake_case) y el JSON del frontend (camelCase).
 */

export type DbUser = {
  id: string
  nombre: string
  correo: string
  password_hash: string | null
  rol: string
  especialidad: string | null
  horario_disponible: string | null
  foto_url: string
  firma_digital: string
}

export type DbPatient = {
  id: string
  user_id: string
  fecha_nacimiento: string | null
  edad: number
  telefono: string
  genero: string
  direccion_calle: string
  direccion_ciudad: string
  alergias: string
  medicamentos_habituales: string
  tipo_sangre: string
  notas_medico: string
  fecha_registro: string | null
}

export type DbAppointment = {
  id: string
  paciente_id: string
  medico_user_id: string
  consultorio_id: string
  fecha_iso: string
  duracion_min: number
  motivo: string
  estado: string
  notas: string
}

export type DbNotification = {
  id: string
  user_id: string
  appointment_id: string | null
  mensaje: string
  fecha_iso: string
  leida: boolean
}

export type DbConsultorio = {
  id: string
  codigo: string
  nombre: string | null
  activo: boolean
}

export type DbAllergenCatalog = {
  id: string
  nombre: string
  codigo: string | null
  activo: boolean
}

export type DbMedicationCatalog = {
  id: string
  nombre: string
  principio_activo: string | null
  activo: boolean
}

export type DbPatientAllergy = {
  id: string
  patient_id: string
  allergen_id: string | null
  detalle_libre: string | null
  severidad: string
  notas: string | null
  registrado_en: string
}

export type DbPatientMedication = {
  id: string
  patient_id: string
  medication_id: string | null
  nombre_libre: string | null
  dosis: string | null
  frecuencia: string | null
  activo: boolean
  fecha_inicio: string | null
  fecha_fin: string | null
  notas: string | null
  registrado_en: string
}

export type DbDoctorScheduleSlot = {
  id: string
  medico_user_id: string
  weekday: number
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

export type DbClinicalEncounter = {
  id: string
  patient_id: string
  appointment_id: string | null
  medico_user_id: string
  started_at: string
  ended_at: string | null
  estado: string
}

export type DbClinicalNote = {
  id: string
  encounter_id: string
  autor_user_id: string
  titulo: string | null
  contenido: string
  created_at: string
}

export function userRowToClient(row: DbUser) {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    /** Nunca exponer password_hash al cliente. */
    rol: row.rol,
    hasPasswordHash: Boolean(row.password_hash && row.password_hash.trim().length > 0),
    ...(row.especialidad ? { especialidad: row.especialidad } : {}),
    ...(row.horario_disponible ? { horarioDisponible: row.horario_disponible } : {}),
    fotoUrl: row.foto_url,
    firmaDigital: row.firma_digital,
  }
}

export function userClientToRow(u: Record<string, unknown>): Record<string, unknown> {
  return {
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    password_hash: (u.password as string | undefined) ?? null,
    rol: u.rol,
    especialidad: (u.especialidad as string | undefined) ?? null,
    horario_disponible: (u.horarioDisponible as string | undefined) ?? null,
    foto_url: u.fotoUrl,
    firma_digital: u.firmaDigital,
  }
}

export function patientRowToClient(row: DbPatient) {
  return {
    id: row.id,
    userId: row.user_id,
    ...(row.fecha_nacimiento ? { fechaNacimiento: row.fecha_nacimiento } : {}),
    ...(row.fecha_registro ? { fechaRegistro: row.fecha_registro } : {}),
    edad: row.edad,
    telefono: row.telefono,
    genero: row.genero,
    direccion: {
      calle: row.direccion_calle ?? '',
      ciudad: row.direccion_ciudad ?? '',
    },
    tipoSangre: row.tipo_sangre ?? '',
    notasMedico: row.notas_medico ?? '',
  }
}

export function patientClientToRow(p: Record<string, unknown>): Record<string, unknown> {
  const dir = (p.direccion as { calle?: string; ciudad?: string }) ?? {}
  return {
    id: p.id,
    user_id: p.userId,
    fecha_nacimiento: p.fechaNacimiento ?? null,
    edad: p.edad ?? 0,
    telefono: p.telefono,
    genero: p.genero,
    direccion_calle: dir.calle ?? '',
    direccion_ciudad: dir.ciudad ?? '',
    alergias: '',
    medicamentos_habituales: '',
    tipo_sangre: p.tipoSangre ?? '',
    notas_medico: p.notasMedico ?? '',
    fecha_registro: p.fechaRegistro ?? null,
  }
}

export function appointmentRowToClient(row: DbAppointment) {
  return {
    id: row.id,
    pacienteId: row.paciente_id,
    medicoUserId: row.medico_user_id,
    consultorioId: row.consultorio_id,
    fechaISO: row.fecha_iso,
    duracionMin: row.duracion_min,
    motivo: row.motivo,
    estado: row.estado,
    notas: row.notas ?? '',
  }
}

export function appointmentClientToRow(a: Record<string, unknown>): Record<string, unknown> {
  let fecha = String(a.fechaISO)
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(fecha)) {
    fecha = new Date(fecha).toISOString()
  }
  return {
    id: a.id,
    paciente_id: a.pacienteId,
    medico_user_id: a.medicoUserId,
    consultorio_id: a.consultorioId,
    fecha_iso: fecha,
    duracion_min: a.duracionMin,
    motivo: a.motivo,
    estado: a.estado,
    notas: a.notas ?? '',
  }
}

export function notificationRowToClient(row: DbNotification) {
  return {
    id: row.id,
    userId: row.user_id,
    appointmentId: row.appointment_id,
    mensaje: row.mensaje,
    fechaISO: row.fecha_iso,
    leida: row.leida,
  }
}

export function notificationClientToRow(n: Record<string, unknown>): Record<string, unknown> {
  let fecha = String(n.fechaISO)
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(fecha)) {
    fecha = new Date(fecha).toISOString()
  }
  return {
    id: n.id,
    user_id: n.userId,
    appointment_id: n.appointmentId ?? null,
    mensaje: n.mensaje,
    fecha_iso: fecha,
    leida: n.leida ?? false,
  }
}

export function consultorioRowToClient(row: DbConsultorio) {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre ?? undefined,
    activo: row.activo,
  }
}

export function consultorioClientToRow(c: Record<string, unknown>): Record<string, unknown> {
  return {
    id: c.id,
    codigo: c.codigo,
    nombre: c.nombre ?? null,
    activo: c.activo ?? true,
  }
}

export function allergenRowToClient(row: DbAllergenCatalog) {
  return {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo ?? undefined,
    activo: row.activo,
  }
}

export function allergenClientToRow(a: Record<string, unknown>): Record<string, unknown> {
  return {
    id: a.id,
    nombre: a.nombre,
    codigo: a.codigo ?? null,
    activo: a.activo ?? true,
  }
}

export function medicationCatalogRowToClient(row: DbMedicationCatalog) {
  return {
    id: row.id,
    nombre: row.nombre,
    principioActivo: row.principio_activo ?? undefined,
    activo: row.activo,
  }
}

export function medicationCatalogClientToRow(m: Record<string, unknown>): Record<string, unknown> {
  return {
    id: m.id,
    nombre: m.nombre,
    principio_activo: m.principioActivo ?? null,
    activo: m.activo ?? true,
  }
}

export function patientAllergyRowToClient(row: DbPatientAllergy) {
  return {
    id: row.id,
    patientId: row.patient_id,
    allergenId: row.allergen_id,
    detalleLibre: row.detalle_libre,
    severidad: row.severidad,
    notas: row.notas,
    registradoEn: row.registrado_en,
  }
}

export function patientAllergyClientToRow(p: Record<string, unknown>): Record<string, unknown> {
  let fecha = String(p.registradoEn)
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(fecha)) {
    fecha = new Date(fecha).toISOString()
  }
  return {
    id: p.id,
    patient_id: p.patientId,
    allergen_id: p.allergenId ?? null,
    detalle_libre: p.detalleLibre ?? null,
    severidad: p.severidad ?? 'no_especificada',
    notas: p.notas ?? null,
    registrado_en: fecha,
  }
}

export function patientMedicationRowToClient(row: DbPatientMedication) {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicationId: row.medication_id,
    nombreLibre: row.nombre_libre,
    dosis: row.dosis,
    frecuencia: row.frecuencia,
    activo: row.activo,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    notas: row.notas,
    registradoEn: row.registrado_en,
  }
}

export function patientMedicationClientToRow(p: Record<string, unknown>): Record<string, unknown> {
  let fecha = String(p.registradoEn)
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(fecha)) {
    fecha = new Date(fecha).toISOString()
  }
  return {
    id: p.id,
    patient_id: p.patientId,
    medication_id: p.medicationId ?? null,
    nombre_libre: p.nombreLibre ?? null,
    dosis: p.dosis ?? null,
    frecuencia: p.frecuencia ?? null,
    activo: p.activo ?? true,
    fecha_inicio: p.fechaInicio ?? null,
    fecha_fin: p.fechaFin ?? null,
    notas: p.notas ?? null,
    registrado_en: fecha,
  }
}

export function doctorSlotRowToClient(row: DbDoctorScheduleSlot) {
  return {
    id: row.id,
    medicoUserId: row.medico_user_id,
    weekday: row.weekday,
    horaInicio: normalizeTime(row.hora_inicio),
    horaFin: normalizeTime(row.hora_fin),
    activo: row.activo,
  }
}

function normalizeTime(t: string): string {
  if (t.length >= 5 && t[2] === ':') return t.slice(0, 5)
  return t
}

export function doctorSlotClientToRow(s: Record<string, unknown>): Record<string, unknown> {
  return {
    id: s.id,
    medico_user_id: s.medicoUserId,
    weekday: s.weekday,
    hora_inicio: `${String(s.horaInicio).slice(0, 5)}:00`,
    hora_fin: `${String(s.horaFin).slice(0, 5)}:00`,
    activo: s.activo ?? true,
  }
}

export function encounterRowToClient(row: DbClinicalEncounter) {
  return {
    id: row.id,
    patientId: row.patient_id,
    appointmentId: row.appointment_id,
    medicoUserId: row.medico_user_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    estado: row.estado,
  }
}

export function encounterClientToRow(e: Record<string, unknown>): Record<string, unknown> {
  return {
    id: e.id,
    patient_id: e.patientId,
    appointment_id: e.appointmentId ?? null,
    medico_user_id: e.medicoUserId,
    started_at: e.startedAt,
    ended_at: e.endedAt ?? null,
    estado: e.estado,
  }
}

export function clinicalNoteRowToClient(row: DbClinicalNote) {
  return {
    id: row.id,
    encounterId: row.encounter_id,
    autorUserId: row.autor_user_id,
    titulo: row.titulo ?? undefined,
    contenido: row.contenido,
    createdAt: row.created_at,
  }
}

export function clinicalNoteClientToRow(n: Record<string, unknown>): Record<string, unknown> {
  return {
    id: n.id,
    encounter_id: n.encounterId,
    autor_user_id: n.autorUserId,
    titulo: n.titulo ?? null,
    contenido: n.contenido,
    created_at: n.createdAt,
  }
}

export type DbMotivoConsulta = {
  id: string
  codigo: string
  nombre_largo: string
  nombre_corto: string
  activo: boolean
}

export type DbDuracionOpcion = {
  id: string
  minutos: number
  activo: boolean
}

export type DbChatbotSettings = {
  id: string
  welcome_message: string
  ask_name: string
  ask_phone: string
  ask_reason: string
  ask_symptoms: string
  updated_at: string
}

export function motivoConsultaRowToClient(row: DbMotivoConsulta) {
  return {
    id: row.id,
    codigo: row.codigo,
    nombreLargo: row.nombre_largo,
    nombreCorto: row.nombre_corto,
    activo: row.activo,
  }
}

export function motivoConsultaClientToRow(m: Record<string, unknown>): Record<string, unknown> {
  return {
    id: m.id,
    codigo: m.codigo,
    nombre_largo: m.nombreLargo,
    nombre_corto: m.nombreCorto,
    activo: m.activo ?? true,
  }
}

export function duracionOpcionRowToClient(row: DbDuracionOpcion) {
  return {
    id: row.id,
    minutos: Number(row.minutos),
    activo: row.activo,
  }
}

export function duracionOpcionClientToRow(d: Record<string, unknown>): Record<string, unknown> {
  return {
    id: d.id,
    minutos: d.minutos,
    activo: d.activo ?? true,
  }
}

export function chatbotSettingsRowToClient(row: DbChatbotSettings) {
  return {
    id: row.id,
    welcomeMessage: row.welcome_message,
    askName: row.ask_name,
    askPhone: row.ask_phone,
    askReason: row.ask_reason,
    askSymptoms: row.ask_symptoms,
    updatedAt: row.updated_at,
  }
}

export function chatbotSettingsClientToRow(c: Record<string, unknown>): Record<string, unknown> {
  return {
    id: c.id,
    welcome_message: c.welcomeMessage,
    ask_name: c.askName,
    ask_phone: c.askPhone,
    ask_reason: c.askReason,
    ask_symptoms: c.askSymptoms,
    updated_at: new Date().toISOString(),
  }
}
