import { Schema, model } from 'mongoose'
import { VIDEO_LIKE_CODE_PREFIX } from '../../../constants/videos/video/video.constants'
import type { VideoLike } from '../../../interfaces/models/videos/video-like/video-like.interface'
import { baseEntityPlugin } from '../../base/base-entity.plugin'

const videoLikeSchema = new Schema<VideoLike>({
  video: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
})

videoLikeSchema.plugin(baseEntityPlugin, { codePrefix: VIDEO_LIKE_CODE_PREFIX })
// One like per user per video, enforced by the database.
videoLikeSchema.index({ video: 1, user: 1 }, { unique: true })

export const VideoLikeModel = model<VideoLike>('VideoLike', videoLikeSchema)
