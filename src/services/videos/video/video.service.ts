import type { QueryFilter } from 'mongoose'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { USER_PUBLIC_FIELDS } from '../../../constants/users/user/user.constants'
import type { CreateVideoDto } from '../../../dtos/videos/video/create-video.dto'
import type { UpdateVideoDto } from '../../../dtos/videos/video/update-video.dto'
import type { VideoQueryDto } from '../../../dtos/videos/video/video-query.dto'
import type { VideoResponseDto } from '../../../dtos/videos/video/video-response.dto'
import type { UploadedVideoFileDto } from '../../../dtos/videos/video/uploaded-video-file.dto'
import type { AuthUser } from '../../../interfaces/auth/auth-user.interface'
import type { Video } from '../../../interfaces/models/videos/video/video.interface'
import type { VideoWithOwner } from '../../../interfaces/models/videos/video/video-with-owner.interface'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import type { PageResult } from '../../../interfaces/common/pagination/page-result.interface'
import { videoRepository } from '../../../repositories/videos/video/video.repository'
import { videoLikeRepository } from '../../../repositories/videos/video-like/video-like.repository'
import { commentRepository } from '../../../repositories/videos/comment/comment.repository'
import { toVideoResponse } from '../../../mappers/videos/video/video.mapper'
import { assertCanManage } from '../../../validations/common/ownership.validation'
import { notFound } from '../../../utilities/errors/app-error.utility'
import { escapeRegex } from '../../../utilities/strings/escape-regex.utility'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

const OWNER_POPULATE = { path: 'owner', select: USER_PUBLIC_FIELDS }

/** Loads an active video or throws 404; shared by every video, like, and comment workflow. */
export const findVideoOrFail = async (videoId: string) => {
  const video = await videoRepository.findById(videoId)
  if (!video) throw notFound(MESSAGES.VIDEOS.NOT_FOUND)
  return video
}

const findVideoWithOwnerOrFail = async (videoId: string): Promise<VideoWithOwner> => {
  const video = await videoRepository.findById(videoId).populate<{ owner: PublicUserSource }>(OWNER_POPULATE)
  if (!video) throw notFound(MESSAGES.VIDEOS.NOT_FOUND)
  return video
}

const isLikedBy = async (videoId: string, viewerId?: string): Promise<boolean> =>
  viewerId ? videoLikeRepository.isLiked(videoId, viewerId) : false

export const listVideos = async (query: VideoQueryDto, viewerId?: string): Promise<PageResult<VideoResponseDto>> => {
  const filter: QueryFilter<Video> = {}
  if (query.ownerId) filter.owner = toObjectId(query.ownerId)
  if (query.search) filter.title = new RegExp(escapeRegex(query.search), 'i')

  const page = await videoRepository.paginate<VideoWithOwner>(filter, query, { populate: OWNER_POPULATE })
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

export const createVideo = async (
  dto: CreateVideoDto,
  file: UploadedVideoFileDto,
  actor: AuthUser
): Promise<VideoResponseDto> => {
  const video = await videoRepository.create(
    { title: dto.title, description: dto.description, ...file, owner: toObjectId(actor.id) },
    actor.id
  )
  return getVideo(video._id.toString(), actor.id)
}

export const updateVideo = async (videoId: string, dto: UpdateVideoDto, actor: AuthUser): Promise<VideoResponseDto> => {
  const video = await findVideoOrFail(videoId)
  assertCanManage(video.owner, actor, true)
  await videoRepository.updateById(videoId, { $set: dto }, actor.id)
  return getVideo(videoId, actor.id)
}

/** Soft-deletes the video and its comments, and removes its likes. The file is kept for audit. */
export const deleteVideo = async (videoId: string, actor: AuthUser): Promise<void> => {
  const video = await findVideoOrFail(videoId)
  assertCanManage(video.owner, actor, true)
  await videoRepository.softDeleteById(videoId, actor.id)
  await Promise.all([
    commentRepository.softDeleteAllForVideo(videoId, actor.id),
    videoLikeRepository.removeAllForVideo(videoId)
  ])
}

export const recordView = async (videoId: string): Promise<void> => {
  await findVideoOrFail(videoId)
  await videoRepository.incrementCounter(videoId, 'viewsCount', 1)
}

/** Resolves a stored file name to an active video so deleted videos are never streamed. */
export const isStreamable = async (fileName: string): Promise<boolean> => videoRepository.exists({ fileName })
