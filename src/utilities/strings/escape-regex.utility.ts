import { REGEX } from '../../constants/common/regex.constants'

export const escapeRegex = (value: string): string => value.replace(REGEX.SPECIAL_CHARACTERS, '\\$&')
