import type { PublicUserResponseDto } from '../user/public-user-response.dto'

/** A user in a people list, with the viewer's relation to them. */
export interface UserSummaryResponseDto extends PublicUserResponseDto {
  isFollowing: boolean
  isMe: boolean
}
