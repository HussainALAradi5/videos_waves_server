import type { Types } from 'mongoose'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface VideoLike extends BaseEntity {
  video: Types.ObjectId
  user: Types.ObjectId
}
