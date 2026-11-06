import { Schema, model } from 'mongoose'
import { VIDEO_CODE_PREFIX, VIDEO_LIMITS } from '../../../constants/videos/video/video.constants'
import type { Video } from '../../../interfaces/models/videos/video/video.interface'
import { baseEntityPlugin } from '../../base/base-entity.plugin'

const videoSchema = new Schema<Video>({
  title: { type: String, required: true, trim: true, maxlength: VIDEO_LIMITS.TITLE_MAX },
  description: { type: String, default: '', trim: true, maxlength: VIDEO_LIMITS.DESCRIPTION_MAX },
  fileName: { type: String, required: true, unique: true },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number, required: true, min: 0 },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  likesCount: { type: Number, default: 0, min: 0 },
  commentsCount: { type: Number, default: 0, min: 0 },
  viewsCount: { type: Number, default: 0, min: 0 }
})

videoSchema.plugin(baseEntityPlugin, { codePrefix: VIDEO_CODE_PREFIX })
videoSchema.index({ deletedAt: 1, createdAt: -1 })
videoSchema.index({ owner: 1, createdAt: -1 })
videoSchema.index({ likesCount: -1 })
videoSchema.index({ viewsCount: -1 })
videoSchema.index({ title: 1 })

export const VideoModel = model<Video>('Video', videoSchema)
