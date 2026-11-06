import type { VideoWithOwner } from '../../../interfaces/models/videos/video/video-with-owner.interface'
import type { VideoResponseDto } from '../../../dtos/videos/video/video-response.dto'
import { buildVideoUrl } from '../../../utilities/media/media-url.utility'
import { toPublicUser } from '../../users/user/user.mapper'

export const toVideoResponse = (video: VideoWithOwner, isLiked: boolean): VideoResponseDto => ({
  id: video._id.toString(),
  code: video.code,
  title: video.title,
  description: video.description,
  videoUrl: buildVideoUrl(video.fileName),
  mimeType: video.mimeType,
  owner: toPublicUser(video.owner),
  likesCount: video.likesCount,
  commentsCount: video.commentsCount,
  viewsCount: video.viewsCount,
  isLiked,
  createdAt: video.createdAt.toISOString(),
  updatedAt: video.updatedAt.toISOString()
})
