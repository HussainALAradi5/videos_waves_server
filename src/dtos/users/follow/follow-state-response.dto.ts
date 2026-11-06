export interface FollowStateResponseDto {
  userName: string
  isFollowing: boolean
  /** A follow request to a private account is waiting for its owner. */
  isRequested: boolean
  followersCount: number
}
