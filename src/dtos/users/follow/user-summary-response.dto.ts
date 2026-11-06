import type { PublicUserResponseDto } from '../user/public-user-response.dto'

/** A user in a people list, with the viewer's relation to them. */
export interface UserSummaryResponseDto extends PublicUserResponseDto {
  isFollowing: boolean
  /** The viewer asked to follow this private account and is waiting. */
  isRequested: boolean
  isMe: boolean
}
