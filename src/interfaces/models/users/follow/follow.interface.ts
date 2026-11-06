import type { Types } from 'mongoose'
import type { BaseEntity } from '../../base/base-entity.interface'

/** One directed relation: the follower follows the followed user. */
export interface Follow extends BaseEntity {
  follower: Types.ObjectId
  following: Types.ObjectId
}
