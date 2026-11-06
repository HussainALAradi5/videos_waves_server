import { Schema, model } from 'mongoose'
import { COMMENT_CODE_PREFIX, COMMENT_LIMITS } from '../../../constants/videos/comment/comment.constants'
import type { Comment } from '../../../interfaces/models/videos/comment/comment.interface'
import { baseEntityPlugin } from '../../base/base-entity.plugin'

const commentSchema = new Schema<Comment>({
  video: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true, trim: true, maxlength: COMMENT_LIMITS.CONTENT_MAX }
})

commentSchema.plugin(baseEntityPlugin, { codePrefix: COMMENT_CODE_PREFIX })
commentSchema.index({ video: 1, deletedAt: 1, createdAt: -1 })

export const CommentModel = model<Comment>('Comment', commentSchema)
