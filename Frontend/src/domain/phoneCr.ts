/** Teléfono local CR: exactamente 8 dígitos; presentación 0000-0000 */

export function parsePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 8)
}

export function formatPhoneDisplay(digits: string): string {
  const d = parsePhoneDigits(digits)
  if (d.length === 0) return ''
  if (d.length <= 4) return d
  return `${d.slice(0, 4)}-${d.slice(4, 8)}`
}

export function isCompletePhoneCr(digits: string): boolean {
  return parsePhoneDigits(digits).length === 8
}
