import type { Request, Response } from 'express'
import { MESSAGES } from '../../../constants/common/messages.constants'
import type { CreateVideoDto } from '../../../dtos/videos/video/create-video.dto'
import type { UpdateVideoDto } from '../../../dtos/videos/video/update-video.dto'
import type { VideoQueryDto } from '../../../dtos/videos/video/video-query.dto'
import type { VideoParamsDto } from '../../../dtos/videos/video/video-params.dto'
import * as videoService from '../../../services/videos/video/video.service'
import * as videoLikeService from '../../../services/videos/video-like/video-like.service'
import { sendCreated, sendPage, sendSuccess } from '../../../utilities/responses/response.utility'
import { getBody, getParams, getQuery, requireUser } from '../../../utilities/requests/request.utility'

const videoIdOf = (req: Request): string => getParams<VideoParamsDto>(req).videoId

export const listVideos = async (req: Request, res: Response): Promise<void> => {
  sendPage(res, await videoService.listVideos(getQuery<VideoQueryDto>(req), req.user?.id))
}

export const getVideo = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await videoService.getVideo(videoIdOf(req), req.user?.id))
}

export const createVideo = async (req: Request, res: Response): Promise<void> => {
  sendCreated(res, await videoService.createVideo(getBody<CreateVideoDto>(req), requireUser(req)))
}

export const updateVideo = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await videoService.updateVideo(videoIdOf(req), getBody<UpdateVideoDto>(req), requireUser(req)))
}

export const deleteVideo = async (req: Request, res: Response): Promise<void> => {
  await videoService.deleteVideo(videoIdOf(req), requireUser(req))
  sendSuccess(res, { message: MESSAGES.VIDEOS.DELETED })
}

export const recordView = async (req: Request, res: Response): Promise<void> => {
  await videoService.recordView(videoIdOf(req))
  sendSuccess(res, { videoId: videoIdOf(req) })
}

export const likeVideo = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await videoLikeService.likeVideo(videoIdOf(req), requireUser(req)))
}

export const unlikeVideo = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await videoLikeService.unlikeVideo(videoIdOf(req), requireUser(req)))
}
