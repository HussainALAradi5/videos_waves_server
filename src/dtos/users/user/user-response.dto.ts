import type { BaseEntityResponseDto } from '../../common/base/base-entity-response.dto'
import type { Role } from '../../../enums/users/roles/role.enum'

export interface UserResponseDto extends BaseEntityResponseDto {
  userName: string
  email: string
  role: Role
  avatarUrl: string | null
  bio: string
  followersCount: number
  followingCount: number
  videosCount: number
}
