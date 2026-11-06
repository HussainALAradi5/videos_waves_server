import type { Role } from '../../enums/users/roles/role.enum'

/** The authenticated caller, attached to the request by the authenticate middleware. */
export interface AuthUser {
  id: string
  role: Role
}
