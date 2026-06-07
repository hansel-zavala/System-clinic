import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

/** Detecta hash bcrypt (2a, 2b, 2y). */
export function looksLikeBcryptHash(s: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(s)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

/** Si ya es bcrypt, devuelve igual; si no, hashea (texto plano o migración). */
export async function hashPasswordIfNeeded(storedOrPlain: string): Promise<string> {
  if (looksLikeBcryptHash(storedOrPlain)) return storedOrPlain
  return hashPassword(storedOrPlain)
}

/**
 * Verifica contraseña: bcrypt si el valor en BD es hash; si no, comparación en claro (migración legacy).
 */
export async function verifyPassword(plain: string, stored: string | null | undefined): Promise<boolean> {
  if (stored == null || stored === '') return false
  if (looksLikeBcryptHash(stored)) {
    return bcrypt.compare(plain, stored)
  }
  return plain === stored
}
