import type { Role } from '../../../enums/users/roles/role.enum'

/** New accounts with a one-time temporary password each, shown to the admin once. */
export interface ImportUsersResponseDto {
  created: { userName: string; email: string; role: Role; temporaryPassword: string }[]
  skipped: { userName: string; email: string; reason: string }[]
}
