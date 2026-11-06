import type { Role } from '../../../enums/users/roles/role.enum'
import type { TokenType } from '../../../enums/users/auth/token-type.enum'

export interface TokenPayload {
  sub: string
  role: Role
  tokenVersion: number
  type: TokenType
  /** The signed-in device (session) this token belongs to. */
  sid: string
  /** Refresh tokens only: the id that must match the session's current token. */
  jti?: string
  exp?: number
}
