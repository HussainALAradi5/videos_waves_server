import type { Types } from 'mongoose'
import type { Role } from '../../../../enums/users/roles/role.enum'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface User extends BaseEntity {
  userName: string
  email: string
  passwordHash: string
  role: Role
  /** Public CDN URL of the avatar media, denormalised so every list can show it without a join. */
  avatarUrl: string | null
  avatar: Types.ObjectId | null
  bio: string
  followersCount: number
  followingCount: number
  videosCount: number
  tokenVersion: number
}
