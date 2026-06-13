import type { Express } from 'express'
import multer from 'multer'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DbUser } from './mappers.js'
import { userRowToClient } from './mappers.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)
    if (ok) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes JPEG, PNG, WebP o GIF.'))
    }
  },
})

function extFromMime(mime: string): string | null {
  const m: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return m[mime] ?? null
}

/**
 * Sube la foto al bucket Storage `avatars` y actualiza `users.foto_url`.
 * Misma confianza que el resto de la API (userId en el body).
 */
export function registerProfilePhotoRoute(app: Express, supabase: SupabaseClient | null) {
  app.post(
    '/api/auth/profile-photo',
    (req, res, next) => {
      upload.single('file')(req as any, res as any, (err: unknown) => {
        if (err) {
          const msg = err instanceof Error ? err.message : 'Error al subir el archivo.'
          return res.status(400).json({ ok: false, message: msg })
        }
        next()
      })
    },
    async (req, res) => {
      if (!supabase) {
        return res.status(503).json({ ok: false, message: 'Supabase no configurado.' })
      }
      const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : ''
      const file = req.file
      if (!userId || !file) {
        return res.status(400).json({ ok: false, message: 'userId y archivo son obligatorios.' })
      }
      const ext = extFromMime(file.mimetype)
      if (!ext) {
        return res.status(400).json({ ok: false, message: 'Tipo de imagen no soportado.' })
      }

      const objectPath = `${userId}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      })
      if (upErr) {
        return res.status(500).json({
          ok: false,
          message:
            `${upErr.message} ` +
            '(¿Creaste el bucket "avatars" en Supabase? Ejecuta database/storage_avatars_bucket.sql.)',
        })
      }

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(objectPath)
      const fotoUrl = `${pub.publicUrl}?v=${Date.now()}`

      const { error: dbErr } = await supabase.from('users').update({ foto_url: fotoUrl }).eq('id', userId)
      if (dbErr) {
        return res.status(500).json({ ok: false, message: dbErr.message })
      }

      const { data: row, error: fetchErr } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
      if (fetchErr || !row) {
        return res.status(500).json({
          ok: false,
          message: fetchErr?.message ?? 'Usuario no encontrado tras actualizar la foto.',
        })
      }

      const user = userRowToClient(row as DbUser)
      res.json({ ok: true, message: 'Foto de perfil actualizada.', fotoUrl, user })
    },
  )
}
