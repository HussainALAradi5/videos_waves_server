import type { Types } from 'mongoose'
import type { CommentVisibility } from '../../../../enums/videos/comment/comment-visibility.enum'
import type { BaseEntity } from '../../base/base-entity.interface'

export interface Comment extends BaseEntity {
  video: Types.ObjectId
  author: Types.ObjectId
  /** The top-level comment this replies to; replies are one level deep, as on Instagram. */
  parent: Types.ObjectId | null
  content: string
  visibility: CommentVisibility
  /** Public replies only, so the "View replies (n)" count matches what everyone sees. */
  repliesCount: number
  editedAt: Date | null
}
