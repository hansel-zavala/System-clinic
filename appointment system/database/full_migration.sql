-- ============================================================
-- Migracion completa: Clinica Aura
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Eliminar tablas existentes (orden inverso a FK)
DROP TABLE IF EXISTS history CASCADE;
DROP TABLE IF EXISTS clinical_notes CASCADE;
DROP TABLE IF EXISTS clinical_encounters CASCADE;
DROP TABLE IF EXISTS doctor_schedule_slots CASCADE;
DROP TABLE IF EXISTS patient_medications CASCADE;
DROP TABLE IF EXISTS patient_allergies CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS medication_catalog CASCADE;
DROP TABLE IF EXISTS allergen_catalog CASCADE;
DROP TABLE IF EXISTS duraciones_opcion CASCADE;
DROP TABLE IF EXISTS motivos_consulta CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS consultorios CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS (sin FK)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  password_hash TEXT,
  rol TEXT NOT NULL DEFAULT 'user',
  especialidad TEXT,
  horario_disponible TEXT,
  foto_url TEXT NOT NULL DEFAULT '',
  firma_digital TEXT NOT NULL DEFAULT ''
);

-- 2. CONSULTORIOS (sin FK)
CREATE TABLE IF NOT EXISTS consultorios (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL,
  nombre TEXT,
  activo BOOLEAN NOT NULL DEFAULT true
);

-- 3. PATIENTS (references users)
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fecha_nacimiento TEXT,
  edad INTEGER NOT NULL DEFAULT 0,
  telefono TEXT NOT NULL DEFAULT '',
  genero TEXT NOT NULL DEFAULT '',
  direccion_calle TEXT NOT NULL DEFAULT '',
  direccion_ciudad TEXT NOT NULL DEFAULT '',
  alergias TEXT NOT NULL DEFAULT '',
  medicamentos_habituales TEXT NOT NULL DEFAULT '',
  tipo_sangre TEXT NOT NULL DEFAULT '',
  notas_medico TEXT NOT NULL DEFAULT '',
  fecha_registro TEXT
);

-- 4. ALLERGEN CATALOG (sin FK)
CREATE TABLE IF NOT EXISTS allergen_catalog (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT,
  activo BOOLEAN NOT NULL DEFAULT true
);

-- 5. MEDICATION CATALOG (sin FK)
CREATE TABLE IF NOT EXISTS medication_catalog (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  principio_activo TEXT,
  activo BOOLEAN NOT NULL DEFAULT true
);

-- 6. APPOINTMENTS (references patients, users, consultorios)
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  paciente_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medico_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consultorio_id TEXT NOT NULL REFERENCES consultorios(id) ON DELETE CASCADE,
  fecha_iso TEXT NOT NULL,
  duracion_min INTEGER NOT NULL DEFAULT 30,
  motivo TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'pendiente',
  notas TEXT NOT NULL DEFAULT ''
);

-- 7. NOTIFICATIONS (references users, appointments)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  mensaje TEXT NOT NULL,
  fecha_iso TEXT NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT false
);

-- 8. PATIENT ALLERGIES (references patients, allergen_catalog)
CREATE TABLE IF NOT EXISTS patient_allergies (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  allergen_id TEXT REFERENCES allergen_catalog(id) ON DELETE SET NULL,
  detalle_libre TEXT,
  severidad TEXT NOT NULL DEFAULT 'no_especificada',
  notas TEXT,
  registrado_en TEXT NOT NULL
);

-- 9. PATIENT MEDICATIONS (references patients, medication_catalog)
CREATE TABLE IF NOT EXISTS patient_medications (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_id TEXT REFERENCES medication_catalog(id) ON DELETE SET NULL,
  nombre_libre TEXT,
  dosis TEXT,
  frecuencia TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_inicio TEXT,
  fecha_fin TEXT,
  notas TEXT,
  registrado_en TEXT NOT NULL
);

-- 10. DOCTOR SCHEDULE SLOTS (references users)
CREATE TABLE IF NOT EXISTS doctor_schedule_slots (
  id TEXT PRIMARY KEY,
  medico_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true
);

-- 11. CLINICAL ENCOUNTERS (references patients, appointments, users)
CREATE TABLE IF NOT EXISTS clinical_encounters (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  medico_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  estado TEXT NOT NULL DEFAULT 'en_curso'
);

-- 12. CLINICAL NOTES (references clinical_encounters, users)
CREATE TABLE IF NOT EXISTS clinical_notes (
  id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  autor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo TEXT,
  contenido TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 13. MOTIVOS CONSULTA (opcional, sin FK)
CREATE TABLE IF NOT EXISTS motivos_consulta (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL,
  nombre_largo TEXT NOT NULL,
  nombre_corto TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true
);

-- 14. DURACIONES OPCION (opcional, sin FK)
CREATE TABLE IF NOT EXISTS duraciones_opcion (
  id TEXT PRIMARY KEY,
  minutos INTEGER NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- Datos iniciales
-- ============================================================

INSERT INTO consultorios (id, codigo, nombre, activo) VALUES
  ('1', 'Consultorio 1', 'Planta baja', true),
  ('2', 'Consultorio 2', 'Primer piso', true),
  ('3', 'Consultorio 3', 'Urgencias', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage: crear bucket "avatars"
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 15. CHATBOT SETTINGS
CREATE TABLE IF NOT EXISTS chatbot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welcome_message TEXT NOT NULL,
  ask_name TEXT NOT NULL,
  ask_phone TEXT NOT NULL,
  ask_reason TEXT NOT NULL,
  ask_symptoms TEXT NOT NULL,
  usar_ia BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO chatbot_settings (id, welcome_message, ask_name, ask_phone, ask_reason, ask_symptoms, usar_ia)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '¡Hola! Soy el Asistente de Reservas de Clínica Aura. Estoy aquí para ayudarte a programar tu visita de forma rápida y segura.',
  'Para comenzar, ¿podrías confirmar tu nombre y apellido completo?',
  'Entendido, {{name}}. ¿Cuál es tu número de teléfono de contacto?',
  'Excelente. ¿Cuál es el motivo principal de tu visita hoy?',
  'Por favor, describe brevemente los síntomas o el problema de consulta por el que deseas visitarnos:',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 16. SCAN HISTORY
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  scanned_data TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  clinic_id TEXT
);
