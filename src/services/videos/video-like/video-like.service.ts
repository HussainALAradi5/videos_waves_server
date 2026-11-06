import type { VideoLikeResponseDto } from '../../../dtos/videos/video/video-like-response.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import { videoRepository } from '../../../repositories/videos/video/video.repository'
import { videoLikeRepository } from '../../../repositories/videos/video-like/video-like.repository'
import { findVideoOrFail } from '../video/video.service'
import { withTransaction } from '../../../utilities/database/transaction.utility'

const buildLikeResponse = async (videoId: string, isLiked: boolean): Promise<VideoLikeResponseDto> => {
  const video = await findVideoOrFail(videoId)
  return { videoId, isLiked, likesCount: video.likesCount }
}

/** Idempotent: liking twice keeps one like and counts it once. The like and its counter commit together. */
export const likeVideo = async (videoId: string, actor: AuthUser): Promise<VideoLikeResponseDto> => {
  await findVideoOrFail(videoId, actor.id)
  await withTransaction(async () => {
    if (await videoLikeRepository.likeOnce(videoId, actor.id)) {
      await videoRepository.incrementCounter(videoId, 'likesCount', 1)
    }
  })
  return buildLikeResponse(videoId, true)
}

/** Idempotent: unliking a video that is not liked changes nothing. */
export const unlikeVideo = async (videoId: string, actor: AuthUser): Promise<VideoLikeResponseDto> => {
  await findVideoOrFail(videoId, actor.id)
  await withTransaction(async () => {
    if (await videoLikeRepository.unlike(videoId, actor.id)) {
      await videoRepository.incrementCounter(videoId, 'likesCount', -1)
    }
  })
  return buildLikeResponse(videoId, false)
}
