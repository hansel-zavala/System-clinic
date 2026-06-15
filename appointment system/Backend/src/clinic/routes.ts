import type { Express } from 'express'
import type { SupabaseClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  allergenRowToClient,
  appointmentRowToClient,
  consultorioRowToClient,
  encounterRowToClient,
  medicationCatalogRowToClient,
  notificationRowToClient,
  patientAllergyRowToClient,
  patientRowToClient,
  patientMedicationRowToClient,
  userRowToClient,
  doctorSlotRowToClient,
  clinicalNoteRowToClient,
  userClientToRow,
  patientClientToRow,
  appointmentClientToRow,
  notificationClientToRow,
  consultorioClientToRow,
  motivoConsultaRowToClient,
  motivoConsultaClientToRow,
  duracionOpcionRowToClient,
  duracionOpcionClientToRow,
  allergenClientToRow,
  medicationCatalogClientToRow,
  patientAllergyClientToRow,
  patientMedicationClientToRow,
  doctorSlotClientToRow,
  encounterClientToRow,
  clinicalNoteClientToRow,
  chatbotSettingsRowToClient,
  chatbotSettingsClientToRow,
} from './mappers.js'
import { resetDatabaseToAdminOnly } from './resetToAdminOnly.js'
import { buildUserRowsForUpsert } from './usersPersist.js'
import { getHistoryRecords, insertHistoryRecord } from './historyPersist.js'
import { hashPassword, verifyPassword } from './passwordCrypto.js'
import { registerProfilePhotoRoute } from './profilePhotoUpload.js'
import type { DbUser } from './mappers.js'

const bookingIPLimitMap = new Map<string, number[]>()
let sseClients: any[] = []

async function upsertAndPrune(
  supabase: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  prune: boolean,
) {
  if (prune) {
    const { data: existing, error: selErr } = await supabase.from(table).select('id')
    if (selErr) throw selErr
    const payloadIds = new Set(rows.map((r) => String(r.id)))
    const toRemove = (existing ?? []).map((e) => String(e.id)).filter((id) => !payloadIds.has(id))
    if (toRemove.length) {
      const { error: delErr } = await supabase.from(table).delete().in('id', toRemove)
      if (delErr) throw delErr
    }
  }
  if (rows.length) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
    if (error) throw error
  }
}

export function registerClinicRoutes(app: Express, supabase: SupabaseClient | null) {
  /** Login: verifica contraseña contra hash en BD; no expone hash. */
  app.post('/api/auth/login', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ ok: false, message: 'Supabase no configurado.' })
    }
    const body = req.body as { correo?: string; password?: string }
    const correo = body.correo?.trim()
    const password = body.password
    if (!correo || !password) {
      return res.status(400).json({ ok: false, message: 'Correo y contraseña son obligatorios.' })
    }
    const normalized = correo.toLowerCase()
    const { data: rows, error } = await supabase.from('users').select('*')
    if (error) {
      return res.status(500).json({ ok: false, message: error.message })
    }
    const row = (rows ?? []).find((r: DbUser) => r.correo.toLowerCase() === normalized) as DbUser | undefined
    if (!row) {
      return res.status(401).json({ ok: false, message: 'No existe un usuario con ese correo.' })
    }
    const ok = await verifyPassword(password, row.password_hash)
    if (!ok) {
      return res.status(401).json({ ok: false, message: 'Contraseña incorrecta.' })
    }
    const user = userRowToClient(row)
    res.json({ ok: true, message: 'Sesión iniciada correctamente.', user })
  })

  /** Cambio de contraseña: verifica la actual y guarda hash nuevo. */
  app.post('/api/auth/change-password', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ ok: false, message: 'Supabase no configurado.' })
    }
    const body = req.body as { userId?: string; currentPassword?: string; newPassword?: string }
    const userId = body.userId?.trim()
    const currentPassword = body.currentPassword
    const newPassword = body.newPassword
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ ok: false, message: 'Completa todos los campos.' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ ok: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' })
    }
    const { data: row, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
    if (error || !row) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' })
    }
    const ok = await verifyPassword(currentPassword, (row as DbUser).password_hash)
    if (!ok) {
      return res.status(401).json({ ok: false, message: 'La contraseña actual es incorrecta.' })
    }
    const newHash = await hashPassword(newPassword)
    const { error: upErr } = await supabase.from('users').update({ password_hash: newHash }).eq('id', userId)
    if (upErr) {
      return res.status(500).json({ ok: false, message: upErr.message })
    }
    res.json({ ok: true, message: 'Contraseña actualizada correctamente.' })
  })

  registerProfilePhotoRoute(app, supabase)

  app.get('/api/clinic/qr-scan-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    sseClients.push(res)

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n')
    }, 30000)

    req.on('close', () => {
      clearInterval(heartbeat)
      sseClients = sseClients.filter((client) => client !== res)
    })
  })

  app.get('/api/clinic/scan-qr', async (req, res) => {
    if (!supabase) {
      return res.status(503).send('Supabase no configurado.')
    }
    const appointmentId = req.query.id as string
    if (!appointmentId) {
      return res.status(400).send('Falta el ID de la cita.')
    }

    try {
      const { data: appData, error: appErr } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single()

      if (appErr || !appData) {
        return res.status(404).send('Cita no encontrada.')
      }

      const { data: patientData, error: patErr } = await supabase
        .from('patients')
        .select('*')
        .eq('id', appData.paciente_id)
        .single()

      let patientName = 'Paciente'
      if (patientData && !patErr) {
        const { data: userData } = await supabase
          .from('users')
          .select('nombre')
          .eq('id', patientData.user_id)
          .single()
        if (userData) {
          patientName = userData.nombre
        }
      }

      sseClients.forEach((client) => {
        client.write(`data: ${JSON.stringify({ appointmentId })}\n\n`)
      })

      try {
        await insertHistoryRecord(supabase, {
          userId: null,
          scannedData: appointmentId,
          clinicId: null,
        })
      } catch (histErr) {
        console.error('[scan-qr] Error al guardar en historial:', histErr)
      }

      res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Check-in Exitoso — Clinica Aura</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Cormorant+Garamond:ital,wght@1,500&display=swap" rel="stylesheet">
          <style>
            :root {
              --primary: #3a8fb7;
              --secondary: #5db0a9;
              --primary-dark: #19384c;
              --bg: #0c1d29;
              --card: rgba(25, 56, 76, 0.45);
              --border: rgba(120, 160, 188, 0.22);
              --text: #f0f8ff;
              --text-muted: #88a0bc;
              --success: #25d366;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Outfit', sans-serif;
              background: radial-gradient(circle at center, #13344c 0%, #0b1d29 100%);
              color: var(--text);
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              box-sizing: border-box;
            }
            .container {
              width: 100%;
              max-width: 440px;
              padding: 20px;
              text-align: center;
            }
            .card {
              background: var(--card);
              backdrop-filter: blur(20px);
              border: 1px solid var(--border);
              border-radius: 24px;
              padding: 40px 30px;
              box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
              animation: slideIn 0.5s cubic-bezier(0.1, 1, 0.1, 1) both;
            }
            .icon-wrap {
              width: 80px;
              height: 80px;
              border-radius: 999px;
              background: rgba(37, 211, 102, 0.12);
              border: 2px solid var(--success);
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 0 auto 24px;
              animation: scaleUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both;
            }
            .icon-wrap svg {
              width: 40px;
              height: 40px;
              fill: none;
              stroke: var(--success);
              stroke-width: 3;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
            h1 {
              font-family: 'Cormorant Garamond', serif;
              font-style: italic;
              font-size: 2.2rem;
              margin: 0 0 10px;
              color: #fff;
              font-weight: 500;
            }
            p.status {
              font-size: 1rem;
              color: var(--text-muted);
              margin: 0 0 30px;
              line-height: 1.5;
            }
            .patient-box {
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.05);
              border-radius: 16px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .label {
              font-size: 0.75rem;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--secondary);
              font-weight: 700;
              margin-bottom: 6px;
            }
            .value {
              font-size: 1.25rem;
              font-weight: 600;
              color: #fff;
            }
            .footer-note {
              font-size: 0.82rem;
              color: var(--text-muted);
              line-height: 1.45;
            }
            @keyframes slideIn {
              from { transform: translateY(30px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes scaleUp {
              from { transform: scale(0.6); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="icon-wrap">
                <svg viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h1>Check-in Completado</h1>
              <p class="status">Tu cita ha sido escaneada exitosamente.</p>
              
              <div class="patient-box">
                <div class="label">Paciente Registrado</div>
                <div class="value">${patientName}</div>
              </div>
              
              <div class="footer-note">
                Los datos de tu consulta se han enviado a la pantalla de recepción. Por favor, toma asiento en la sala de espera.
              </div>
            </div>
          </div>
        </body>
        </html>
      `)
    } catch (e) {
      console.error(e)
      res.status(500).send('Error interno en el servidor.')
    }
  })

  // Nueva ruta para el App de Escaneo QR (Android)
  app.post('/api/clinic/check-in', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ success: false, message: 'Supabase no configurado.' })
    }

    const { qrData, userId, clinicId } = req.body as { qrData: string; userId?: string; clinicId?: string }
    if (!qrData) {
      return res.status(400).json({ success: false, message: 'Faltan datos del QR.' })
    }

    let appointmentId = qrData
    // Si los datos del QR vienen con el prefijo propietario
    if (qrData.startsWith('CLINICA_AURA|')) {
      appointmentId = qrData.split('|')[1]
    }
    // Si los datos del QR vienen como URL completa, extraemos el ID
    else if (qrData.includes('?id=')) {
      try {
        const url = new URL(qrData)
        appointmentId = url.searchParams.get('id') || qrData
      } catch (e) {
        // No es una URL válida, asumimos que qrData es el ID
      }
    }

    try {
      // 1. Buscar la cita
      const { data: appData, error: appErr } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single()

      if (appErr || !appData) {
        return res.status(404).json({ success: false, message: 'Cita no encontrada.' })
      }

      // 2. Obtener datos del paciente para la respuesta
      const { data: patientData, error: patErr } = await supabase
        .from('patients')
        .select('user_id')
        .eq('id', appData.paciente_id)
        .single()

      let patientName = 'Paciente'
      if (patientData && !patErr) {
        const { data: userData } = await supabase
          .from('users')
          .select('nombre')
          .eq('id', patientData.user_id)
          .single()
        if (userData) {
          patientName = userData.nombre
        }
      }

      // 3. Validar asistencia (actualizar estado a 'confirmada' si estaba 'pendiente')
      if (appData.estado === 'pendiente') {
        await supabase
          .from('appointments')
          .update({ estado: 'confirmada' })
          .eq('id', appointmentId)
      }

      // 4. Notificar al Frontend (Panel Administrativo) via SSE
      sseClients.forEach((client) => {
        client.write(`data: ${JSON.stringify({ appointmentId, action: 'check-in', patientName })}\n\n`)
      })

      try {
        await insertHistoryRecord(supabase, {
          userId: userId || null,
          scannedData: qrData,
          clinicId: clinicId || null,
          patientName: patientName,
        })
      } catch (histErr) {
        console.error('[check-in] Error al guardar en historial:', histErr)
      }

      // 5. Responder a la App
      const fecha = new Date(appData.fecha_iso)
      const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

      return res.json({
        success: true,
        message: 'Check-in realizado con éxito.',
        patientName: patientName,
        time: hora
      })

    } catch (e) {
      console.error('[check-in API] Error:', e)
      return res.status(500).json({ success: false, message: 'Error interno en el servidor.' })
    }
  })

  app.get('/api/history', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ ok: false, message: 'Supabase no configurado.' })
    }
    try {
      const records = await getHistoryRecords(supabase)
      return res.json({ ok: true, data: records })
    } catch (e) {
      console.error('[GET /api/history] Error:', e)
      return res.status(500).json({ ok: false, message: 'Error interno en el servidor.' })
    }
  })

  app.post('/api/history', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ ok: false, message: 'Supabase no configurado.' })
    }
    const { userId, scannedData, clinicId } = req.body as { userId?: string; scannedData?: string; clinicId?: string }
    if (!scannedData) {
      return res.status(400).json({ ok: false, message: 'Falta el contenido escaneado (scannedData).' })
    }
    try {
      const record = await insertHistoryRecord(supabase, {
        userId,
        scannedData,
        clinicId,
      })
      return res.status(201).json({ ok: true, message: 'Registro de historial creado.', data: record })
    } catch (e) {
      console.error('[POST /api/history] Error:', e)
      return res.status(500).json({ ok: false, message: 'Error interno en el servidor.' })
    }
  })



  app.get('/api/clinic/tables', async (_req, res) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no configurado.' })
    }

    const [
      usersR,
      patientsR,
      appointmentsR,
      notificationsR,
      consultoriosR,
      allergenR,
      medicationR,
      pAllergiesR,
      pMedsR,
      slotsR,
      encR,
      notesR,
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('patients').select('*'),
      supabase.from('appointments').select('*'),
      supabase.from('notifications').select('*'),
      supabase.from('consultorios').select('*'),
      supabase.from('allergen_catalog').select('*'),
      supabase.from('medication_catalog').select('*'),
      supabase.from('patient_allergies').select('*'),
      supabase.from('patient_medications').select('*'),
      supabase.from('doctor_schedule_slots').select('*'),
      supabase.from('clinical_encounters').select('*'),
      supabase.from('clinical_notes').select('*'),
    ])

    /** Tablas opcionales: si no existen (migración pendiente), no falla todo el GET. */
    const motivosR = await supabase.from('motivos_consulta').select('*')
    const duracionesR = await supabase.from('duraciones_opcion').select('*')
    if (motivosR.error) {
      console.warn(
        '[clinic] motivos_consulta no disponible —',
        motivosR.error.message,
        '(opcional: ejecuta database/migration_motivos_duraciones.sql)',
      )
    }
    if (duracionesR.error) {
      console.warn(
        '[clinic] duraciones_opcion no disponible —',
        duracionesR.error.message,
        '(opcional: ejecuta database/migration_motivos_duraciones.sql)',
      )
    }

    const err =
      usersR.error ||
      patientsR.error ||
      appointmentsR.error ||
      notificationsR.error ||
      consultoriosR.error ||
      allergenR.error ||
      medicationR.error ||
      pAllergiesR.error ||
      pMedsR.error ||
      slotsR.error ||
      encR.error ||
      notesR.error
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    res.json({
      users: (usersR.data ?? []).map((r) => userRowToClient(r as Parameters<typeof userRowToClient>[0])),
      patients: (patientsR.data ?? []).map((r) => patientRowToClient(r as Parameters<typeof patientRowToClient>[0])),
      appointments: (appointmentsR.data ?? []).map((r) =>
        appointmentRowToClient(r as Parameters<typeof appointmentRowToClient>[0]),
      ),
      notifications: (notificationsR.data ?? []).map((r) =>
        notificationRowToClient(r as Parameters<typeof notificationRowToClient>[0]),
      ),
      consultorios: (consultoriosR.data ?? []).map((r) =>
        consultorioRowToClient(r as Parameters<typeof consultorioRowToClient>[0]),
      ),
      motivosConsulta: (motivosR.error ? [] : (motivosR.data ?? [])).map((r) =>
        motivoConsultaRowToClient(r as Parameters<typeof motivoConsultaRowToClient>[0]),
      ),
      duracionesOpcion: (duracionesR.error ? [] : (duracionesR.data ?? [])).map((r) =>
        duracionOpcionRowToClient(r as Parameters<typeof duracionOpcionRowToClient>[0]),
      ),
      allergenCatalog: (allergenR.data ?? []).map((r) =>
        allergenRowToClient(r as Parameters<typeof allergenRowToClient>[0]),
      ),
      medicationCatalog: (medicationR.data ?? []).map((r) =>
        medicationCatalogRowToClient(r as Parameters<typeof medicationCatalogRowToClient>[0]),
      ),
      patientAllergies: (pAllergiesR.data ?? []).map((r) =>
        patientAllergyRowToClient(r as Parameters<typeof patientAllergyRowToClient>[0]),
      ),
      patientMedications: (pMedsR.data ?? []).map((r) =>
        patientMedicationRowToClient(r as Parameters<typeof patientMedicationRowToClient>[0]),
      ),
      doctorScheduleSlots: (slotsR.data ?? []).map((r) =>
        doctorSlotRowToClient(r as Parameters<typeof doctorSlotRowToClient>[0]),
      ),
      clinicalEncounters: (encR.data ?? []).map((r) =>
        encounterRowToClient(r as Parameters<typeof encounterRowToClient>[0]),
      ),
      clinicalNotes: (notesR.data ?? []).map((r) =>
        clinicalNoteRowToClient(r as Parameters<typeof clinicalNoteRowToClient>[0]),
      ),
    })
  })

  /**
   * Borra todos los datos y deja solo un usuario admin (+ 3 consultorios mínimos para la agenda).
   * Requiere `RESET_SECRET` en .env y el mismo valor en el body: `{ "secret": "..." }`.
   */
  app.post('/api/clinic/reset-to-admin-only', async (req, res) => {
    const expected = process.env.RESET_SECRET
    if (!expected?.trim()) {
      return res.status(503).json({
        error: 'RESET_SECRET no está configurado. Añádelo en Backend/.env para usar este endpoint.',
      })
    }
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no configurado.' })
    }
    const body = req.body as { secret?: string; nombre?: string; correo?: string; password?: string; adminId?: string }
    if (body.secret !== expected) {
      return res.status(403).json({ error: 'Secreto incorrecto.' })
    }
    const result = await resetDatabaseToAdminOnly(supabase, {
      adminId: body.adminId,
      nombre: body.nombre,
      correo: body.correo,
      password: body.password,
    })
    if (!result.ok) {
      return res.status(500).json({ error: result.message })
    }
    res.json({
      ok: true,
      message:
        'Base limpia. Queda solo el usuario administrador y el catálogo mínimo de consultorios. Recarga el frontend.',
      adminId: result.adminId,
      correo: result.correo,
    })
  })

  app.patch('/api/clinic/tables', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no configurado.' })
    }

    const body = req.body as Record<string, unknown>
    try {
      if (body.users) {
        const rows = await buildUserRowsForUpsert(supabase, body.users as Record<string, unknown>[])
        await upsertAndPrune(supabase, 'users', rows, false)
      }
      if (body.patients) {
        const rows = (body.patients as Record<string, unknown>[]).map((p) => patientClientToRow(p))
        await upsertAndPrune(supabase, 'patients', rows, false)
      }
      if (body.appointments) {
        const rows = (body.appointments as Record<string, unknown>[]).map((a) => appointmentClientToRow(a))
        await upsertAndPrune(supabase, 'appointments', rows, true)
      }
      if (body.notifications) {
        const rows = (body.notifications as Record<string, unknown>[]).map((n) => notificationClientToRow(n))
        await upsertAndPrune(supabase, 'notifications', rows, true)
      }
      if (body.consultorios) {
        const rows = (body.consultorios as Record<string, unknown>[]).map((c) => consultorioClientToRow(c))
        await upsertAndPrune(supabase, 'consultorios', rows, true)
      }
      if (body.motivosConsulta) {
        const rows = (body.motivosConsulta as Record<string, unknown>[]).map((m) => motivoConsultaClientToRow(m))
        await upsertAndPrune(supabase, 'motivos_consulta', rows, true)
      }
      if (body.duracionesOpcion) {
        const rows = (body.duracionesOpcion as Record<string, unknown>[]).map((d) => duracionOpcionClientToRow(d))
        await upsertAndPrune(supabase, 'duraciones_opcion', rows, true)
      }
      if (body.allergenCatalog) {
        const rows = (body.allergenCatalog as Record<string, unknown>[]).map((a) => allergenClientToRow(a))
        await upsertAndPrune(supabase, 'allergen_catalog', rows, false)
      }
      if (body.medicationCatalog) {
        const rows = (body.medicationCatalog as Record<string, unknown>[]).map((m) => medicationCatalogClientToRow(m))
        await upsertAndPrune(supabase, 'medication_catalog', rows, false)
      }
      if (body.patientAllergies) {
        const rows = (body.patientAllergies as Record<string, unknown>[]).map((p) => patientAllergyClientToRow(p))
        await upsertAndPrune(supabase, 'patient_allergies', rows, true)
      }
      if (body.patientMedications) {
        const rows = (body.patientMedications as Record<string, unknown>[]).map((p) => patientMedicationClientToRow(p))
        await upsertAndPrune(supabase, 'patient_medications', rows, true)
      }
      if (body.doctorScheduleSlots) {
        const rows = (body.doctorScheduleSlots as Record<string, unknown>[]).map((s) => doctorSlotClientToRow(s))
        await upsertAndPrune(supabase, 'doctor_schedule_slots', rows, false)
      }
      if (body.clinicalEncounters) {
        const rows = (body.clinicalEncounters as Record<string, unknown>[]).map((e) => encounterClientToRow(e))
        await upsertAndPrune(supabase, 'clinical_encounters', rows, false)
      }
      if (body.clinicalNotes) {
        const rows = (body.clinicalNotes as Record<string, unknown>[]).map((n) => clinicalNoteClientToRow(n))
        await upsertAndPrune(supabase, 'clinical_notes', rows, false)
      }
      res.json({ ok: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(500).json({ error: msg })
    }
  })

  /** Endpoint para verificar disponibilidad de citas */
  app.get('/api/clinic/availability', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ ok: false, error: 'Supabase no configurado.' })
    }

    // Rate limiting simple en memoria para consultas de disponibilidad
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip'
    const now = Date.now()
    const windowMs = 15 * 60 * 1000
    const limitMap = bookingIPLimitMap.get(ip + '_avail') ?? []
    const activeRequests = limitMap.filter((t) => now - t < windowMs)
    if (activeRequests.length >= 30) {
      return res.status(429).json({ ok: false, error: 'Demasiadas consultas de disponibilidad. Por favor espera unos minutos.' })
    }
    activeRequests.push(now)
    bookingIPLimitMap.set(ip + '_avail', activeRequests)

    const fechaISO = req.query.fechaISO as string
    if (!fechaISO) {
      return res.status(400).json({ ok: false, error: 'Falta el parámetro fechaISO.' })
    }

    try {
      const targetDate = new Date(fechaISO)
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ ok: false, error: 'Formato de fecha inválido.' })
      }

      // 1. Consultorios activos
      const { data: consultorios, error: cErr } = await supabase
        .from('consultorios')
        .select('id')
        .eq('activo', true)
      if (cErr) throw cErr

      // 2. Médicos (usuarios con rol = 'medico') y sus horarios
      const { data: allMedicos, error: mErr } = await supabase
        .from('users')
        .select('id, nombre, horario_disponible')
        .eq('rol', 'medico')
      if (mErr) throw mErr

      if (!consultorios || consultorios.length === 0) {
        return res.json({ ok: true, libre: false, message: 'No hay consultorios activos disponibles en la clínica.' })
      }
      if (!allMedicos || allMedicos.length === 0) {
        return res.json({ ok: true, libre: false, message: 'No hay médicos registrados en el sistema.' })
      }

      // 3. Filtrar médicos por horario disponible (ajustado a la zona horaria de Costa Rica UTC-6)
      const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
      const localDate = new Date(targetDate.getTime() - 6 * 60 * 60 * 1000)
      const targetDayName = weekdays[localDate.getUTCDay()]
      const targetTimeStr = localDate.getUTCHours().toString().padStart(2, '0') + ':' + localDate.getUTCMinutes().toString().padStart(2, '0')

      const medicosConHorario = allMedicos.filter(m => {
        if (!m.horario_disponible) return true // Si no tiene horario, asumimos siempre disponible (opcional)
        
        const scheduleParts = m.horario_disponible.split(',').map((s: string) => s.trim())
        return scheduleParts.some((part: string) => {
          if (!part.startsWith(targetDayName)) return false
          const timeRange = part.replace(targetDayName, '').trim() // "08:00-12:00"
          const [start, end] = timeRange.split('-')
          return targetTimeStr >= start && targetTimeStr < end
        })
      })

      if (medicosConHorario.length === 0) {
        return res.json({ ok: true, libre: false, message: `No hay médicos que atiendan los ${targetDayName} a las ${targetTimeStr}.` })
      }

      // 4. Citas programadas en esta fecha (excluyendo canceladas)
      const { data: appointments, error: aErr } = await supabase
        .from('appointments')
        .select('medico_user_id, consultorio_id')
        .or(`fecha_iso.eq.${fechaISO},fecha_iso.eq.${fechaISO.replace('.000Z', 'Z')},fecha_iso.eq.${fechaISO.replace('Z', '.000Z')}`)
        .neq('estado', 'cancelada')
      if (aErr) throw aErr

      const occupiedConsultorios = new Set((appointments ?? []).map((a) => a.consultorio_id))
      const occupiedMedicos = new Set((appointments ?? []).map((a) => a.medico_user_id))

      const freeConsultorio = consultorios.find((c) => !occupiedConsultorios.has(c.id))
      const freeMedico = medicosConHorario.find((m) => !occupiedMedicos.has(m.id))

      if (freeConsultorio && freeMedico) {
        return res.json({
          ok: true,
          libre: true,
          medicoId: freeMedico.id,
          consultorioId: freeConsultorio.id,
        })
      } else {
        let reason = 'El horario seleccionado ya está ocupado.'
        if (medicosConHorario.length > 0 && !freeMedico) {
          reason = 'Todos los médicos disponibles para este horario ya tienen una cita programada.'
        }
        if (!freeConsultorio) {
          reason = 'Todos los consultorios están ocupados para este horario.'
        }
        
        return res.json({ ok: true, libre: false, message: reason })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(500).json({ ok: false, error: msg })
    }
  })

  /** Endpoint para agendar citas desde el chatbot */
  app.post('/api/clinic/chatbot-booking', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ ok: false, error: 'Supabase no configurado.' })
    }

    // Rate limiting simple en memoria para agendamiento de citas
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip'
    const now = Date.now()
    const windowMs = 15 * 60 * 1000
    const limitMap = bookingIPLimitMap.get(ip + '_book') ?? []
    const activeRequests = limitMap.filter((t) => now - t < windowMs)
    if (activeRequests.length >= 3) {
      return res.status(429).json({ ok: false, error: 'Has superado el límite de citas reservadas por hoy (máximo 3 por cada 15 minutos).' })
    }

    const body = req.body as {
      nombre?: string
      telefono?: string
      fechaISO?: string
      motivo?: string
      notas?: string
    }

    const nombre = body.nombre?.trim()
    const telefono = body.telefono?.trim()
    const fechaISO = body.fechaISO?.trim()
    const motivo = body.motivo?.trim()
    const notas = body.notas?.trim()

    if (!nombre || !telefono || !fechaISO || !motivo) {
      return res.status(400).json({ ok: false, error: 'Faltan campos requeridos (nombre, telefono, fechaISO, motivo).' })
    }

    try {
      // 1. Verificar disponibilidad y obtener médico/consultorio libres
      const { data: consultorios, error: cErr } = await supabase
        .from('consultorios')
        .select('id')
        .eq('activo', true)
      if (cErr) throw cErr

      const { data: medicos, error: mErr } = await supabase
        .from('users')
        .select('id')
        .eq('rol', 'medico')
      if (mErr) throw mErr

      if (!consultorios || consultorios.length === 0 || !medicos || medicos.length === 0) {
        return res.status(400).json({ ok: false, error: 'No hay recursos médicos disponibles en la clínica.' })
      }

      const { data: appointments, error: aErr } = await supabase
        .from('appointments')
        .select('medico_user_id, consultorio_id')
        .or(`fecha_iso.eq.${fechaISO},fecha_iso.eq.${fechaISO.replace('.000Z', 'Z')},fecha_iso.eq.${fechaISO.replace('Z', '.000Z')}`)
        .neq('estado', 'cancelada')
      if (aErr) throw aErr

      const occupiedConsultorios = new Set((appointments ?? []).map((a) => a.consultorio_id))
      const occupiedMedicos = new Set((appointments ?? []).map((a) => a.medico_user_id))

      const freeConsultorio = consultorios.find((c) => !occupiedConsultorios.has(c.id))
      const freeMedico = medicos.find((m) => !occupiedMedicos.has(m.id))

      if (!freeConsultorio || !freeMedico) {
        return res.status(400).json({ ok: false, error: 'El horario seleccionado ya no está disponible.' })
      }

      // 2. Buscar o crear el paciente, y verificar si tiene cita pendiente futura
      const cleanPhone = telefono.replace(/\D/g, '') // Elimina caracteres no numéricos
      let pacienteId = ''
      let userPacienteId = ''

      const { data: existingPatients, error: pErr } = await supabase
        .from('patients')
        .select('id, user_id')
        .eq('telefono', cleanPhone)
        .limit(1)
      if (pErr) throw pErr

      if (existingPatients && existingPatients.length > 0) {
        pacienteId = existingPatients[0].id
        userPacienteId = existingPatients[0].user_id

        // Comprobar si ya tiene una cita activa ('pendiente' o 'confirmada') en el futuro (mismo día o posterior)
        const todayIso = new Date().toISOString().split('T')[0]
        const { data: activeAppts, error: activeErr } = await supabase
          .from('appointments')
          .select('id, fecha_iso')
          .eq('paciente_id', pacienteId)
          .in('estado', ['pendiente', 'confirmada'])
        if (activeErr) throw activeErr

        const futureAppt = (activeAppts ?? []).find((a) => {
          const apptDate = a.fecha_iso.split('T')[0]
          return apptDate >= todayIso
        })

        if (futureAppt) {
          return res.status(400).json({
            ok: false,
            error: 'Ya cuentas con una cita programada pendiente en nuestro sistema. Para reagendarla o cancelarla, comunícate con la administración.',
          })
        }
      } else {
        // Crear usuario paciente
        userPacienteId = newNumericId()
        pacienteId = newNumericId()
        const passHash = await hashPassword('Paciente123!')
        const initials = nombre
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? '')
          .join('') || 'PA'

        const userRow = {
          id: userPacienteId,
          nombre,
          correo: `${cleanPhone}@clinica.local`,
          password_hash: passHash,
          rol: 'paciente',
          foto_url: 'https://i.pravatar.cc/180?img=24',
          firma_digital: initials,
        }

        const { error: insUserErr } = await supabase.from('users').insert([userRow])
        if (insUserErr) throw insUserErr

        const patientRow = {
          id: pacienteId,
          user_id: userPacienteId,
          fecha_nacimiento: null,
          edad: 0,
          telefono: cleanPhone,
          genero: 'Otro',
          direccion_calle: '',
          direccion_ciudad: '',
          alergias: '',
          medicamentos_habituales: '',
          tipo_sangre: '',
          notas_medico: '',
          fecha_registro: new Date().toISOString().split('T')[0],
        }

        const { error: insPatientErr } = await supabase.from('patients').insert([patientRow])
        if (insPatientErr) throw insPatientErr
      }

      // 3. Registrar la cita
      const appointmentId = newNumericId()
      const newAppointment = {
        id: appointmentId,
        paciente_id: pacienteId,
        medico_user_id: freeMedico.id,
        consultorio_id: freeConsultorio.id,
        fecha_iso: fechaISO,
        duracion_min: 30,
        motivo,
        estado: 'pendiente',
        notas: notas || 'Registrado automáticamente por el Asistente virtual',
      }

      const { error: insAppErr } = await supabase.from('appointments').insert([newAppointment])
      if (insAppErr) throw insAppErr

      // 4. Crear notificaciones
      const notifPatient = {
        id: newNumericId(),
        user_id: userPacienteId,
        appointment_id: appointmentId,
        mensaje: `Cita agendada para el ${new Date(fechaISO).toLocaleString('es-ES')}.`,
        fecha_iso: new Date().toISOString(),
        leida: false,
      }

      const notifMedico = {
        id: newNumericId(),
        user_id: freeMedico.id,
        appointment_id: appointmentId,
        mensaje: `Nueva cita asignada vía Chatbot para el ${new Date(fechaISO).toLocaleString('es-ES')}.`,
        fecha_iso: new Date().toISOString(),
        leida: false,
      }

      const { error: insNotifErr } = await supabase.from('notifications').insert([notifPatient, notifMedico])
      if (insNotifErr) {
        console.error('[chatbot-booking] Error al crear notificaciones:', insNotifErr.message)
      }

      // Registrar esta reserva exitosa en el rate limit de la IP
      activeRequests.push(now)
      bookingIPLimitMap.set(ip + '_book', activeRequests)

      res.json({
        ok: true,
        message: 'Cita registrada con éxito.',
        appointment: {
          id: appointmentId,
          pacienteId,
          medicoUserId: freeMedico.id,
          consultorioId: freeConsultorio.id,
          fechaISO,
          duracionMin: 30,
          motivo,
          estado: 'pendiente',
          notas: newAppointment.notas,
        },
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(500).json({ ok: false, error: msg })
    }
  })

  /** Obtener configuración del chatbot y motivos activos */
  app.get('/api/clinic/settings/chatbot', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ ok: false, error: 'Supabase no configurado.' })
    }
    try {
      const { data: settings, error: setErr } = await supabase
        .from('chatbot_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (setErr) throw setErr

      const { data: motivos, error: motErr } = await supabase
        .from('motivos_consulta')
        .select('*')
        .eq('activo', true)

      if (motErr) throw motErr

      res.json({
        ok: true,
        settings: settings ? chatbotSettingsRowToClient(settings) : null,
        motivos: (motivos ?? []).map(motivoConsultaRowToClient),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(500).json({ ok: false, error: msg })
    }
  })

  /** Actualizar configuración del chatbot */
  app.put('/api/clinic/settings/chatbot', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ ok: false, error: 'Supabase no configurado.' })
    }
    try {
      const body = req.body as any
      const row = chatbotSettingsClientToRow(body)

      const { data, error } = await supabase
        .from('chatbot_settings')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          ...row,
        })
        .select()
        .single()

      if (error) throw error

      res.json({ ok: true, settings: chatbotSettingsRowToClient(data) })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(500).json({ ok: false, error: msg })
    }
  })

  /** AI Chat: Procesa mensajes con Gemini */
  app.post('/api/clinic/chat-ai', async (req, res) => {
    if (!supabase) {
      return res.status(503).json({ ok: false, error: 'Supabase no configurado.' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.status(503).json({ ok: false, error: 'GEMINI_API_KEY no configurada en el servidor.' })
    }

    try {
      const { message, history } = req.body as { message: string; history: any[] }
      console.log('[AI Chat] Request:', { message, historyCount: history?.length })
      
      // 1. Obtener contexto dinámico de la clínica (Motivos de Consulta)
      const { data: motivos } = await supabase.from('motivos_consulta').select('nombre_largo').eq('activo', true)
      const motivosStr = (motivos ?? []).map(m => m.nombre_largo).join(', ')

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction: `Eres el Asistente Inteligente de Clínica Aura. Tu objetivo es ayudar a los pacientes de forma amable y profesional.

REGLAS CRÍTICAS DE COMPORTAMIENTO:
1. SOLO puedes hablar de temas relacionados con la clínica, medicina básica preventiva y gestión de citas.
2. Si el usuario te pregunta por política, deportes, entretenimiento, otros negocios o cualquier tema ajeno, responde educadamente: "Lo siento, como asistente de Clínica Aura, solo puedo asistirle con temas relacionados a nuestros servicios médicos y citas". No te salgas de este papel bajo ninguna circunstancia.
3. Tu misión principal es recolectar: NOMBRE COMPLETO, TELÉFONO (8 dígitos) y MOTIVO DE CONSULTA.
4. Los motivos de consulta válidos en nuestra clínica son exclusivamente: ${motivosStr}. Si el usuario menciona otro, intenta guiarlo hacia uno de estos.
5. NO inventes servicios que la clínica no tiene.

FLUJO DE CITA:
- Cuando detectes que el usuario ha proporcionado su NOMBRE, su TELÉFONO y un MOTIVO válido, confirma los datos con él.
- Una vez confirmados, dile que procedes a mostrarle los horarios disponibles.
- AL FINAL de tu respuesta, si ya tienes los 3 datos, añade SIEMPRE este JSON exacto en una nueva línea (no lo menciones verbalmente):
{"intent": "CONFIRM_BOOKING", "data": {"name": "...", "phone": "...", "reason": "..."}}

Recuerda: Sé empático pero mantén los límites de la empresa.`
      })

      const chat = model.startChat({
        history: (history || []).map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        }))
      })

      const result = await chat.sendMessage(message)
      const responseText = result.response.text()

      res.json({ ok: true, text: responseText })
    } catch (e) {
      console.error('[AI Chat] Error:', e)
      const msg = e instanceof Error ? e.message : String(e)
      res.status(500).json({ ok: false, error: msg })
    }
  })
}

function newNumericId(): string {
  const t = Date.now()
  const r = Math.floor(Math.random() * 1_000_000)
  return `${t}${String(r).padStart(6, '0')}`
}

