/**
 * Identificadores únicos formados **solo por dígitos** (0-9), sin prefijos tipo `u`, `p`, `admin1`.
 * Usa timestamp + sufijo aleatorio para evitar colisiones en el mismo milisegundo.
 */
export function newNumericId(): string {
  const t = Date.now()
  const r = Math.floor(Math.random() * 1_000_000)
  return `${t}${String(r).padStart(6, '0')}`
}

/** Usuario “vacío” antes de cargar datos (solo dígitos). */
export const EMPTY_USER_NUMERIC_ID = '0'
