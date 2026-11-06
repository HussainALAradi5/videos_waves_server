import type { Types } from 'mongoose'
import type { BaseEntity } from '../../base/base-entity.interface'

/** A pending request to follow a private account; it becomes a follow when the owner accepts it. */
export interface FollowRequest extends BaseEntity {
  requester: Types.ObjectId
  target: Types.ObjectId
}
