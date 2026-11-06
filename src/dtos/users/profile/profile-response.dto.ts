import type { Role } from '../../../enums/users/roles/role.enum'
import type { PublicUserResponseDto } from '../user/public-user-response.dto'

export interface ProfileResponseDto extends PublicUserResponseDto {
  bio: string
  followersCount: number
  followingCount: number
  videosCount: number
  createdAt: string
  isMe: boolean
  role: Role
  /** False when an admin deactivated the account (only admins can see such a profile). */
  isActive: boolean
  /** The viewer follows this user. */
  isFollowing: boolean
  /** This user follows the viewer. */
  followsYou: boolean
  /** The viewer blocked this user (their videos are hidden until unblocked). */
  isBlocked: boolean
  /** The viewer restricted this user. */
  isRestricted: boolean
  /** The viewer asked to follow this private account and is waiting. */
  isRequested: boolean
  /** This user asked to follow the viewer's private account (show Accept / Decline). */
  requestedYou: boolean
  /** Only approved followers see a private account's videos and follow lists. */
  isPrivate: boolean
  /** False for a private account the viewer does not follow: show the lock instead of videos. */
  canViewContent: boolean
}
