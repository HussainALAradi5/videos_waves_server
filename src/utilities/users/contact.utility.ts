import { REGEX } from '../../constants/common/regex.constants'

/** `+973 3300-1122`, `(555) 010 0001`, and `00973...` all become `+97333001122` style E.164 numbers. */
export const normalizePhone = (value: string): string => {
  const compact = value.replace(/[\s\-().]/g, '')
  return compact.startsWith('00') ? `+${compact.slice(2)}` : compact
}

export const isPhone = (value: string): boolean => REGEX.PHONE.test(normalizePhone(value))

/** What a people search was given: a full email, a full phone number, or neither (no results). */
export const parseContact = (value: string): { email: string } | { phone: string } | null => {
  const text = value.trim()
  if (REGEX.EMAIL.test(text)) return { email: text.toLowerCase() }
  if (isPhone(text)) return { phone: normalizePhone(text) }
  return null
}
