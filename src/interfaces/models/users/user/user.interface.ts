import type { Types } from 'mongoose'
import type { Role } from '../../../../enums/users/roles/role.enum'
import type { Gender } from '../../../../enums/users/user/gender.enum'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface User extends BaseEntity {
  userName: string
  email: string
  passwordHash: string
  role: Role
  /** null for accounts created before gender was asked (they get the neutral avatar). */
  gender: Gender | null
  /** Public CDN URL of the avatar media, denormalised so every list can show it without a join. */
  avatarUrl: string | null
  avatar: Types.ObjectId | null
  bio: string
  followersCount: number
  followingCount: number
  videosCount: number
  /** Set by an admin; hides the account and its content until reactivated. */
  deactivatedAt: Date | null
  deactivatedBy: Types.ObjectId | null
  tokenVersion: number
}
