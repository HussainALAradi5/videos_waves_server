import type { Types } from 'mongoose'
import type { BaseEntity } from '../../base/base-entity.interface'

/** One directed relation: the blocker hides themselves from the blocked user and vice versa. */
export interface Block extends BaseEntity {
  blocker: Types.ObjectId
  blocked: Types.ObjectId
}
