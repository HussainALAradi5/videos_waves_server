import type { Types } from 'mongoose'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface Comment extends BaseEntity {
  video: Types.ObjectId
  author: Types.ObjectId
  content: string
}
