import type { Role } from '../../../enums/users/roles/role.enum'

export interface TokenSubject {
  id: string
  role: Role
  tokenVersion: number
  sessionId: string
}
