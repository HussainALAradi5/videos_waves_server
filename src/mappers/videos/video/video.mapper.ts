import type { VideoWithOwner } from '../../../interfaces/models/videos/video/video-with-owner.interface'
import type { VideoResponseDto } from '../../../dtos/videos/video/video-response.dto'
import { toMediaResponse } from '../../media/media/media.mapper'
import { toPublicUser } from '../../users/user/user.mapper'

export const toVideoResponse = (video: VideoWithOwner, isLiked: boolean): VideoResponseDto => {
  const media = toMediaResponse(video.media)
  return {
    id: video._id.toString(),
    code: video.code,
    title: video.title,
    description: video.description,
    videoUrl: media.url,
    thumbnailUrl: media.thumbnailUrl,
    mimeType: media.mimeType,
    durationSeconds: media.durationSeconds,
    owner: toPublicUser(video.owner),
    likesCount: video.likesCount,
    commentsCount: video.commentsCount,
    viewsCount: video.viewsCount,
    isLiked,
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString()
  }
}
