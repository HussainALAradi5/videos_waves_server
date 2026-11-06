import { Schema, model } from 'mongoose'
import { COMMENT_CODE_PREFIX, COMMENT_LIMITS } from '../../../constants/videos/comment/comment.constants'
import { CommentVisibility } from '../../../enums/videos/comment/comment-visibility.enum'
import type { Comment } from '../../../interfaces/models/videos/comment/comment.interface'
import { baseEntityPlugin } from '../../base/base-entity.model'

const commentSchema = new Schema<Comment>({
  video: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  parent: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  content: { type: String, required: true, trim: true, maxlength: COMMENT_LIMITS.CONTENT_MAX },
  visibility: { type: String, enum: Object.values(CommentVisibility), default: CommentVisibility.PUBLIC },
  repliesCount: { type: Number, default: 0, min: 0 },
  editedAt: { type: Date, default: null }
})

commentSchema.plugin(baseEntityPlugin, { codePrefix: COMMENT_CODE_PREFIX })
commentSchema.index({ video: 1, parent: 1, deletedAt: 1, createdAt: -1 })
commentSchema.index({ parent: 1, deletedAt: 1, createdAt: 1 })

export const CommentModel = model<Comment>('Comment', commentSchema)
