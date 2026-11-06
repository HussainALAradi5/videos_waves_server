import type { Request, Response } from 'express'
import { MESSAGES } from '../../../constants/common/messages.constants'
import type { CommentBodyDto } from '../../../dtos/videos/comment/comment-body.dto'
import type { CommentQueryDto } from '../../../dtos/videos/comment/comment-query.dto'
import type { CommentParamsDto } from '../../../dtos/videos/comment/comment-params.dto'
import type { VideoParamsDto } from '../../../dtos/videos/video/video-params.dto'
import * as commentService from '../../../services/videos/comment/comment.service'
import { sendCreated, sendPage, sendSuccess } from '../../../utilities/responses/response.utility'
import { getBody, getParams, getQuery, requireUser } from '../../../utilities/requests/request.utility'

export const listComments = async (req: Request, res: Response): Promise<void> => {
  const { videoId } = getParams<VideoParamsDto>(req)
  sendPage(res, await commentService.listComments(videoId, getQuery<CommentQueryDto>(req)))
}

export const createComment = async (req: Request, res: Response): Promise<void> => {
  const { videoId } = getParams<VideoParamsDto>(req)
  sendCreated(res, await commentService.createComment(videoId, getBody<CommentBodyDto>(req), requireUser(req)))
}

export const updateComment = async (req: Request, res: Response): Promise<void> => {
  const params = getParams<CommentParamsDto>(req)
  sendSuccess(res, await commentService.updateComment(params, getBody<CommentBodyDto>(req), requireUser(req)))
}

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  await commentService.deleteComment(getParams<CommentParamsDto>(req), requireUser(req))
  sendSuccess(res, { message: MESSAGES.COMMENTS.DELETED })
}
