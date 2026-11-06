import type { PublicUserSource } from '../user/public-user-source.interface'

/** A follow row with one side populated (null when that user was deactivated). */
export interface FollowWithUser {
  follower?: PublicUserSource | null
  following?: PublicUserSource | null
}
