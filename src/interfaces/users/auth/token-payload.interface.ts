import type { Role } from '../../../enums/users/roles/role.enum'
import type { TokenType } from '../../../enums/users/auth/token-type.enum'

export interface TokenPayload {
  sub: string
  role: Role
  tokenVersion: number
  type: TokenType
}
