import { REGEX } from '../../constants/common/regex.constants'
import { escapeRegex } from '../strings/escape-regex.utility'

/** `+973 3300-1122`, `(555) 010 0001`, and `00973...` all become `+97333001122` style E.164 numbers. */
export const normalizePhone = (value: string): string => {
  const compact = value.replace(/[\s\-().]/g, '')
  return compact.startsWith('00') ? `+${compact.slice(2)}` : compact
}

export const isPhone = (value: string): boolean => REGEX.PHONE.test(normalizePhone(value))

/** Fewer digits than this would match almost every phone, so short numbers only search names and emails. */
const MIN_PHONE_DIGITS = 3

/** `$or` conditions for a people search: part of the username or email (any case), or of the phone's digits. */
export const buildPeopleMatch = (value: string): Record<string, RegExp>[] => {
  const text = value.trim()
  if (text === '') return []
  const pattern = new RegExp(escapeRegex(text), 'i')
  const conditions: Record<string, RegExp>[] = [{ userName: pattern }, { email: pattern }]
  const digits = text.replace(/\D/g, '')
  if (digits.length >= MIN_PHONE_DIGITS) conditions.push({ phone: new RegExp(digits) })
  return conditions
}
