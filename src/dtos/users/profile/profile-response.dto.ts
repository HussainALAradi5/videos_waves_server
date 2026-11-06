import type { PublicUserResponseDto } from '../user/public-user-response.dto'

export interface ProfileResponseDto extends PublicUserResponseDto {
  bio: string
  followersCount: number
  followingCount: number
  videosCount: number
  createdAt: string
  isMe: boolean
  /** The viewer follows this user. */
  isFollowing: boolean
  /** This user follows the viewer. */
  followsYou: boolean
  /** The viewer blocked this user (their videos are hidden until unblocked). */
  isBlocked: boolean
  /** The viewer restricted this user. */
  isRestricted: boolean
}
