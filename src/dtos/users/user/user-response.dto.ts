import type { Role } from '../../../enums/users/roles/role.enum'

export interface UserResponseDto {
  id: string
  code: string
  userName: string
  email: string
  role: Role
  image: string | null
  createdAt: string
}
