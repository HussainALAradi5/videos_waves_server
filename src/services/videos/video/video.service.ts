import type { QueryFilter } from 'mongoose'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { USER_PUBLIC_FIELDS } from '../../../constants/users/user/user.constants'
import type { CreateVideoDto } from '../../../dtos/videos/video/create-video.dto'
import type { UpdateVideoDto } from '../../../dtos/videos/video/update-video.dto'
import type { VideoQueryDto } from '../../../dtos/videos/video/video-query.dto'
import type { VideoResponseDto } from '../../../dtos/videos/video/video-response.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { Video } from '../../../interfaces/models/videos/video/video.interface'
import type { VideoWithOwner } from '../../../interfaces/models/videos/video/video-with-owner.interface'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import type { PageResult } from '../../../interfaces/common/pagination/page-result.interface'
import { videoRepository } from '../../../repositories/videos/video/video.repository'
import { videoLikeRepository } from '../../../repositories/videos/video-like/video-like.repository'
import { commentRepository } from '../../../repositories/videos/comment/comment.repository'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { toVideoResponse } from '../../../mappers/videos/video/video.mapper'
import { assertCanManage } from '../../../validations/common/ownership.validation'
import { notFound } from '../../../utilities/errors/app-error.utility'
import { escapeRegex } from '../../../utilities/strings/escape-regex.utility'
import { toObjectId } from '../../../utilities/ids/object-id.utility'
import { withTransaction } from '../../../utilities/database/transaction.utility'
import { MediaKind } from '../../../enums/media/media/media-kind.enum'
import type { Media } from '../../../interfaces/models/media/media/media.interface'
import { claimMedia, releaseMedia } from '../../media/media/media.service'
import { purgeProviderFiles } from '../../media/media/media-cleanup.service'

const VIDEO_POPULATE = [{ path: 'owner', select: USER_PUBLIC_FIELDS }, { path: 'media' }]

/** Loads an active video or throws 404; shared by every video, like, and comment workflow. */
export const findVideoOrFail = async (videoId: string) => {
  const video = await videoRepository.findById(videoId)
  if (!video) throw notFound(MESSAGES.VIDEOS.NOT_FOUND)
  return video
}

const findVideoWithOwnerOrFail = async (videoId: string): Promise<VideoWithOwner> => {
  const video = await videoRepository
    .findById(videoId)
    .populate<{ owner: PublicUserSource; media: Media }>(VIDEO_POPULATE)
  if (!video) throw notFound(MESSAGES.VIDEOS.NOT_FOUND)
  return video
}

const isLikedBy = async (videoId: string, viewerId?: string): Promise<boolean> =>
  viewerId ? videoLikeRepository.isLiked(videoId, viewerId) : false

export const listVideos = async (query: VideoQueryDto, viewerId?: string): Promise<PageResult<VideoResponseDto>> => {
  const filter: QueryFilter<Video> = {}
  if (query.ownerId) filter.owner = toObjectId(query.ownerId)
  if (query.search) filter.title = new RegExp(escapeRegex(query.search), 'i')

  const page = await videoRepository.paginate<VideoWithOwner>(filter, query, { populate: VIDEO_POPULATE })
  const likedIds = viewerId
    ? await videoLikeRepository.findLikedVideoIds(viewerId, page.items.map((video) => video._id))
    : new Set<string>()
  return {
    items: page.items.map((video) => toVideoResponse(video, likedIds.has(video._id.toString()))),
    meta: page.meta
  }
}

export const getVideo = async (videoId: string, viewerId?: string): Promise<VideoResponseDto> => {
  const [video, isLiked] = await Promise.all([findVideoWithOwnerOrFail(videoId), isLikedBy(videoId, viewerId)])
  return toVideoResponse(video, isLiked)
}

/** Publishes an uploaded file: claims the caller's pending video media and creates the video in one transaction. */
export const createVideo = async (dto: CreateVideoDto, actor: AuthUser): Promise<VideoResponseDto> => {
  const video = await withTransaction(async () => {
    await claimMedia([dto.mediaId], MediaKind.VIDEO, actor)
    const created = await videoRepository.create(
      { title: dto.title, description: dto.description, media: toObjectId(dto.mediaId), owner: toObjectId(actor.id) },
      actor.id
    )
    await userRepository.incrementCounter(actor.id, 'videosCount', 1)
    return created
  })
  return getVideo(video._id.toString(), actor.id)
}

export const updateVideo = async (videoId: string, dto: UpdateVideoDto, actor: AuthUser): Promise<VideoResponseDto> => {
  const video = await findVideoOrFail(videoId)
  assertCanManage(video.owner, actor, true)
  await videoRepository.updateById(videoId, { $set: dto }, actor.id)
  return getVideo(videoId, actor.id)
}

/** Soft-deletes the video, its comments, and its media, and removes its likes; then deletes the CDN file. */
export const deleteVideo = async (videoId: string, actor: AuthUser): Promise<void> => {
  const video = await findVideoOrFail(videoId)
  assertCanManage(video.owner, actor, true)
  await withTransaction(async () => {
    await videoRepository.softDeleteById(videoId, actor.id)
    await commentRepository.softDeleteAllForVideo(videoId, actor.id)
    await videoLikeRepository.removeAllForVideo(videoId)
    await releaseMedia([video.media.toString()], actor.id)
    await userRepository.incrementCounter(video.owner.toString(), 'videosCount', -1)
  })
  await purgeProviderFiles([video.media.toString()])
}

export const recordView = async (videoId: string): Promise<void> => {
  await findVideoOrFail(videoId)
  await videoRepository.incrementCounter(videoId, 'viewsCount', 1)
}
