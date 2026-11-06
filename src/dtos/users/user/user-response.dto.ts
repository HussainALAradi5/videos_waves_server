import type { Role } from '../../../enums/users/roles/role.enum'

export interface UserResponseDto {
  id: string
  code: string
  userName: string
  email: string
  role: Role
  avatarUrl: string | null
  bio: string
  followersCount: number
  followingCount: number
  videosCount: number
  createdAt: string
}
