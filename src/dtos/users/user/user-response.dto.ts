import type { BaseEntityResponseDto } from '../../common/base/base-entity-response.dto'
import type { Role } from '../../../enums/users/roles/role.enum'
import type { Gender } from '../../../enums/users/user/gender.enum'

export interface UserResponseDto extends BaseEntityResponseDto {
  userName: string
  email: string
  role: Role
  gender: Gender | null
  avatarUrl: string | null
  bio: string
  followersCount: number
  followingCount: number
  videosCount: number
}
