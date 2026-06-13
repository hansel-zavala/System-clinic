import { jsPDF } from 'jspdf'
import { formatDateFromYyyyMmDd, formatDateTimeLongEs, formatDateTimeSystem } from '../datetimeDisplay'
import { motivoConsultaLabel } from '../motivoConsulta'
import type { AppointmentView } from '../types'

const C = {
  primary: [34, 95, 128] as const,
  secondary: [112, 189, 178] as const,
  muted: [100, 125, 138] as const,
  lightLine: [200, 218, 228] as const,
  boxBg: [241, 248, 252] as const,
  boxBorder: [186, 210, 222] as const,
  text: [28, 55, 70] as const,
  white: [255, 255, 255] as const,
}

const M = 14
const PAGE_W = 210
const CONTENT_W = PAGE_W - 2 * M
const GAP = 2.5
const LH = 4.1

function pageH(doc: jsPDF) {
  return doc.internal.pageSize.getHeight()
}

function wrapLines(doc: jsPDF, text: string, maxWidth: number) {
  return doc.splitTextToSize(text || '—', maxWidth)
}

function drawFooter(doc: jsPDF) {
  const h = pageH(doc)
  const n = doc.getNumberOfPages()
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    doc.setDrawColor(...C.lightLine)
    doc.setLineWidth(0.15)
    doc.line(M, h - 14, PAGE_W - M, h - 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.muted)
    doc.text('CONFIDENCIAL — Uso exclusivo del personal autorizado · Clínica Aura', M, h - 9)
    doc.text(`Página ${i} de ${n}`, PAGE_W - M - 24, h - 9)
    doc.setTextColor(...C.text)
  }
}

function drawPageHeader(doc: jsPDF, docTitle: string, compact = false) {
  const w = PAGE_W
  if (!compact) {
    doc.setFillColor(...C.primary)
    doc.rect(0, 0, w, 22, 'F')
    doc.setFillColor(...C.secondary)
    doc.rect(0, 22, w, 2, 'F')
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('Clínica Aura', M, 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(220, 235, 245)
    doc.text('Atención integral · Historia clínica digital', M, 19)
    doc.setTextColor(...C.text)
    let y = 32
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11.5)
    doc.setTextColor(...C.primary)
    doc.text(docTitle, M, y)
    y += 5.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...C.muted)
    doc.text(`Generado: ${new Date().toLocaleString('es')}`, M, y)
    return y + 6
  }
  doc.setFillColor(...C.boxBg)
  doc.setDrawColor(...C.boxBorder)
  doc.rect(M, 10, CONTENT_W, 9, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.primary)
  doc.text('Clínica Aura', M + 2, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...C.muted)
  doc.text(docTitle, M + 2, 18)
  doc.setTextColor(...C.text)
  return 24
}

function drawSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFillColor(...C.secondary)
  doc.rect(M, y, 2.5, 5.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...C.primary)
  doc.text(title.toUpperCase(), M + 5, y + 4)
  doc.setTextColor(...C.text)
  doc.setFont('helvetica', 'normal')
  return y + 8
}

/** Párrafo descriptivo (contexto del documento). */
function drawDescriptiveLine(doc: jsPDF, y: number, text: string): number {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...C.muted)
  const lines = wrapLines(doc, text, CONTENT_W)
  doc.text(lines, M, y)
  doc.setTextColor(...C.text)
  return y + Math.max(lines.length, 1) * LH + 3
}

/** Campo compacto: etiqueta pequeña + valor (una o varias líneas). */
function drawFieldCompact(doc: jsPDF, y: number, label: string, value: string): number {
  const pad = 2.5
  const innerW = CONTENT_W - pad * 2
  const valueLines = wrapLines(doc, value, innerW)
  const boxH = pad + 3.5 + Math.max(valueLines.length, 1) * LH + pad

  doc.setFillColor(...C.boxBg)
  doc.setDrawColor(...C.boxBorder)
  doc.setLineWidth(0.12)
  doc.roundedRect(M, y, CONTENT_W, boxH, 0.8, 0.8, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...C.muted)
  doc.text(label.toUpperCase(), M + pad, y + pad + 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...C.text)
  doc.text(valueLines, M + pad, y + pad + 7)

  return y + boxH + GAP
}

/** Dos campos en paralelo (mitad de ancho cada uno) para ahorrar altura. */
function drawFieldPair(
  doc: jsPDF,
  y: number,
  left: [string, string],
  right: [string, string],
): number {
  const mid = 3
  const halfW = (CONTENT_W - mid) / 2
  const pad = 2.5

  const linesL = wrapLines(doc, left[1], halfW - pad * 2)
  const linesR = wrapLines(doc, right[1], halfW - pad * 2)
  const hL = pad + 3.5 + Math.max(linesL.length, 1) * LH + pad
  const hR = pad + 3.5 + Math.max(linesR.length, 1) * LH + pad
  const boxH = Math.max(hL, hR)

  const drawHalf = (x: number, w: number, label: string, lines: string[]) => {
    doc.setFillColor(...C.boxBg)
    doc.setDrawColor(...C.boxBorder)
    doc.roundedRect(x, y, w, boxH, 0.8, 0.8, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.muted)
    doc.text(label.toUpperCase(), x + pad, y + pad + 3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...C.text)
    doc.text(lines, x + pad, y + pad + 7)
  }

  drawHalf(M, halfW, left[0], linesL)
  drawHalf(M + halfW + mid, halfW, right[0], linesR)

  return y + boxH + GAP
}

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  const bottom = pageH(doc) - 18
  if (y + need > bottom) {
    doc.addPage()
    return drawPageHeader(doc, 'Continuación', true)
  }
  return y
}

/** Firma al final del contenido (solo si el generador del PDF es médico y aporta imagen data URL). */
function appendFirmaProfesional(
  doc: jsPDF,
  y: number,
  firmaDataUrl: string | null | undefined,
  firmanteNombre: string | undefined,
): number {
  if (!firmaDataUrl || !firmaDataUrl.startsWith('data:image')) return y

  y = ensureSpace(doc, y, 42)
  y = drawSectionTitle(doc, y, 'Firma digital del profesional')
  y += 3

  const fmt: 'PNG' | 'JPEG' = firmaDataUrl.includes('image/png') ? 'PNG' : 'JPEG'

  try {
    const imgW = 55
    const imgH = 20
    doc.addImage(firmaDataUrl, fmt, M, y, imgW, imgH)
    y += imgH + 4
  } catch {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(...C.muted)
    doc.text('(No se pudo incrustar la imagen de firma.)', M, y + 4)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.text)
  }

  if (firmanteNombre?.trim()) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...C.text)
    doc.text(firmanteNombre.trim(), M, y)
    y += 6
  }
  doc.setTextColor(...C.text)
  return y
}

export type PdfFirmaOptions = {
  /** Imagen data URL (p. ej. PNG del lienzo); si no hay imagen, no se añade bloque. */
  firmaDigital?: string | null
  /** Nombre del profesional que firma (médico generador). */
  firmanteNombre?: string
}

/** PDF expediente de cita (sin identificador interno). */
export function downloadAppointmentExpedientePdf(apt: AppointmentView, firma?: PdfFirmaOptions) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = drawPageHeader(doc, 'Informe de consulta ambulatoria')

  y = drawSectionTitle(doc, y, 'Resumen')
  const motivoLabel = motivoConsultaLabel(apt.motivo, 'long')
  const sala = apt.salaConsultorio || apt.consultorioNombre || 'por asignar'
  const fechaLarga = formatDateTimeLongEs(apt.fechaISO)
  y = drawDescriptiveLine(
    doc,
    y,
    `Consulta de ${motivoLabel.toLowerCase()} para ${apt.pacienteNombre}. ` +
      `Atención a cargo de ${apt.medicoAsignado}. ` +
      `Programada el ${fechaLarga}. ` +
      `Consultorio o sala: ${sala}. ` +
      `Duración prevista: ${apt.duracionMin} minutos. Estado actual: ${apt.estado}.`,
  )

  y = drawSectionTitle(doc, y, 'Datos clínicos y administrativos')
  y = ensureSpace(doc, y, 22)
  y = drawFieldCompact(doc, y, 'Nombre completo del paciente', apt.pacienteNombre)

  y = ensureSpace(doc, y, 20)
  y = drawFieldPair(
    doc,
    y,
    ['Tipo de consulta', motivoLabel],
    ['Estado de la cita', apt.estado],
  )

  y = ensureSpace(doc, y, 20)
  y = drawFieldPair(
    doc,
    y,
    ['Fecha y hora de inicio', formatDateTimeSystem(apt.fechaISO)],
    ['Tiempo estimado de consulta', `${apt.duracionMin} minutos`],
  )

  y = ensureSpace(doc, y, 20)
  y = drawFieldPair(
    doc,
    y,
    ['Profesional tratante', apt.medicoAsignado],
    ['Ubicación (consultorio / sala)', sala],
  )

  y = ensureSpace(doc, y, 28)
  y = drawSectionTitle(doc, y, 'Observaciones y notas de la consulta')
  y = ensureSpace(doc, y, 32)
  y = drawFieldCompact(
    doc,
    y,
    'Notas registradas en esta cita',
    apt.notas || 'No se han registrado observaciones clínicas para esta consulta.',
  )

  y = appendFirmaProfesional(doc, y, firma?.firmaDigital, firma?.firmanteNombre)

  drawFooter(doc)
  doc.save(`expediente-cita-${apt.id}.pdf`)
}

export type PatientExpedientePdfInput = {
  nombre: string
  correo: string
  telefono: string
  edadTexto: string
  genero: string
  fechaNacimiento?: string
  fechaRegistro?: string
  direccion: string
  tipoSangre: string
  alergias: string
  medicamentos: string
  notasMedico: string
  citasResumen: string[]
}

/** PDF expediente clínico del paciente. */
export function downloadPatientClinicalPdf(data: PatientExpedientePdfInput, firma?: PdfFirmaOptions) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = drawPageHeader(doc, 'Historia clínica resumida')

  y = drawSectionTitle(doc, y, 'Resumen del paciente')
  const nac = data.fechaNacimiento
    ? ` Fecha de nacimiento: ${formatDateFromYyyyMmDd(data.fechaNacimiento)}.`
    : ''
  const reg = data.fechaRegistro ? ` Registro en clínica: ${formatDateFromYyyyMmDd(data.fechaRegistro)}.` : ''
  y = drawDescriptiveLine(
    doc,
    y,
      `Expediente con datos demográficos, alergias, medicación habitual y citas registradas en el sistema ` +
      `para ${data.nombre} (${data.edadTexto}, ${data.genero}).${nac}${reg} ` +
      `Contacto: ${data.telefono}, correo ${data.correo}.`,
  )

  y = drawSectionTitle(doc, y, 'Datos de identificación y contacto')
  y = ensureSpace(doc, y, 22)
  y = drawFieldCompact(doc, y, 'Nombre completo', data.nombre)
  y = ensureSpace(doc, y, 20)
  y = drawFieldPair(doc, y, ['Correo electrónico', data.correo], ['Teléfono de contacto', data.telefono])
  y = ensureSpace(doc, y, 20)
  y = drawFieldPair(doc, y, ['Edad', data.edadTexto], ['Sexo registrado', data.genero])
  y = ensureSpace(doc, y, 22)
  y = drawFieldCompact(doc, y, 'Domicilio o dirección de contacto', data.direccion || 'No indicada.')
  y = ensureSpace(doc, y, 20)
  y = drawFieldCompact(doc, y, 'Grupo sanguíneo (ABO/Rh)', data.tipoSangre || 'No registrado')

  if (data.fechaNacimiento && data.fechaRegistro) {
    y = ensureSpace(doc, y, 20)
    y = drawFieldPair(doc, y, [
      'Fecha de nacimiento',
      formatDateFromYyyyMmDd(data.fechaNacimiento),
    ], ['Alta en la clínica', formatDateFromYyyyMmDd(data.fechaRegistro)])
  } else {
    if (data.fechaNacimiento) {
      y = ensureSpace(doc, y, 22)
      y = drawFieldCompact(doc, y, 'Fecha de nacimiento', formatDateFromYyyyMmDd(data.fechaNacimiento))
    }
    if (data.fechaRegistro) {
      y = ensureSpace(doc, y, 22)
      y = drawFieldCompact(doc, y, 'Fecha de alta en la clínica', formatDateFromYyyyMmDd(data.fechaRegistro))
    }
  }

  y = ensureSpace(doc, y, 24)
  y = drawSectionTitle(doc, y, 'Antecedentes de seguridad clínica')
  y = ensureSpace(doc, y, 28)
  y = drawFieldCompact(
    doc,
    y,
    'Alergias medicamentosas y otras (detalle)',
    data.alergias || 'Niega alergias conocidas o no constan en el expediente.',
  )
  y = ensureSpace(doc, y, 28)
  y = drawFieldCompact(
    doc,
    y,
    'Medicación crónica o habitual (dosis si constan)',
    data.medicamentos || 'Sin medicación habitual registrada.',
  )

  y = ensureSpace(doc, y, 26)
  y = drawSectionTitle(doc, y, 'Notas clínicas generales')
  y = ensureSpace(doc, y, 32)
  y = drawFieldCompact(
    doc,
    y,
    'Observaciones del médico tratante',
    data.notasMedico || 'Sin notas médicas generales en el expediente.',
  )

  y = ensureSpace(doc, y, 22)
  y = drawSectionTitle(doc, y, 'Historial de citas en el sistema')
  const citasText =
    data.citasResumen.length > 0
      ? data.citasResumen.map((line, i) => `${i + 1}. ${line}`).join('\n')
      : 'No constan citas asociadas a este paciente en el sistema.'
  y = ensureSpace(doc, y, Math.min(18 + data.citasResumen.length * 3, 100))
  y = drawFieldCompact(doc, y, 'Listado cronológico (más recientes primero)', citasText)

  y = appendFirmaProfesional(doc, y, firma?.firmaDigital, firma?.firmanteNombre)

  drawFooter(doc)
  const safeName = data.nombre.replace(/[^\w\-]+/g, '_').slice(0, 40)
  doc.save(`expediente-paciente-${safeName}.pdf`)
}
