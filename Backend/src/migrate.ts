import 'dotenv/config'
import pg from 'pg'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = resolve(__dirname, '../../database/full_migration.sql')

const connectionString = process.env.SUPABASE_DB_URL

if (!connectionString) {
  console.error('Falta SUPABASE_DB_URL en Backend/.env')
  console.error('Obtenela de: Project Settings > Database > Connection string (URI)')
  process.exit(1)
}

const sql = readFileSync(sqlPath, 'utf-8')
const pool = new pg.Pool({ connectionString })

try {
  await pool.query(sql)
  console.log('Migracion ejecutada correctamente.')
} catch (err) {
  console.error('Error en migracion:', err instanceof Error ? err.message : String(err))
  process.exit(1)
} finally {
  await pool.end()
}
