import type { Role } from '../../../../enums/users/roles/role.enum'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface User extends BaseEntity {
  userName: string
  email: string
  passwordHash: string
  role: Role
  image: string | null
  tokenVersion: number
}
