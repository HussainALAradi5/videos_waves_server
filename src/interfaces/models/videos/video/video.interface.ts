import type { Types } from 'mongoose'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface Video extends BaseEntity {
  title: string
  description: string
  /** The uploaded file (a Media record of kind video). */
  media: Types.ObjectId
  owner: Types.ObjectId
  likesCount: number
  commentsCount: number
  viewsCount: number
}
