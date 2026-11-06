import type { PublicUserSource } from '../user/public-user-source.interface'

/** A request row with the requester populated (null when that user was deactivated). */
export interface FollowRequestWithUser {
  requester?: PublicUserSource | null
}
