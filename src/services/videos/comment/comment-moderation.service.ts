import { MESSAGES } from '../../../constants/common/messages.constants'
import { COMMENT_UNDO_WINDOW_MS } from '../../../constants/videos/comment/comment.constants'
import { Role } from '../../../enums/users/roles/role.enum'
import { CommentVisibility } from '../../../enums/videos/comment/comment-visibility.enum'
import type { CommentParamsDto } from '../../../dtos/videos/comment/comment-params.dto'
import type { CommentResponseDto } from '../../../dtos/videos/comment/comment-response.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import { commentRepository } from '../../../repositories/videos/comment/comment.repository'
import { conflict, forbidden, notFound } from '../../../utilities/errors/app-error.utility'
import { isSameId } from '../../../utilities/ids/object-id.utility'
import { withTransaction } from '../../../utilities/database/transaction.utility'
import { findVideoOrFail } from '../video/video.service'
import { applyCommentCounters, findCommentOrFail, getCommentResponse } from './comment.service'

/**
 * The author, the video owner (their own post), or an admin (moderation) may delete. A top-level
 * comment takes its replies with it. The deleter can undo it within COMMENT_UNDO_WINDOW_MS.
 */
export const deleteComment = async (params: CommentParamsDto, actor: AuthUser): Promise<void> => {
  const video = await findVideoOrFail(params.videoId, actor.id)
  const comment = await findCommentOrFail(params)
  const isAllowed =
    isSameId(comment.author, actor.id) || isSameId(video.owner, actor.id) || actor.role === Role.ADMIN
  if (!isAllowed) throw forbidden(MESSAGES.AUTH.FORBIDDEN)
  await withTransaction(async () => {
    await commentRepository.softDeleteThread(params.commentId, actor.id, new Date())
    await applyCommentCounters(comment, -1)
  })
}

/** Undo for a delete: only the person who deleted it, and only shortly afterwards. */
export const restoreComment = async (params: CommentParamsDto, actor: AuthUser): Promise<CommentResponseDto> => {
  const video = await findVideoOrFail(params.videoId, actor.id)
  const comment = await commentRepository.findDeletedInVideo(params.videoId, params.commentId)
  if (!comment?.deletedAt) throw notFound(MESSAGES.COMMENTS.NOT_FOUND)
  if (!isSameId(comment.deletedBy, actor.id)) throw forbidden(MESSAGES.AUTH.FORBIDDEN)
  if (Date.now() - comment.deletedAt.getTime() > COMMENT_UNDO_WINDOW_MS) throw conflict(MESSAGES.COMMENTS.UNDO_EXPIRED)
  const deletedAt = comment.deletedAt
  await withTransaction(async () => {
    await commentRepository.restoreThread(params.commentId, deletedAt, actor.id)
    await applyCommentCounters(comment, 1)
  })
  return getCommentResponse(params.commentId, video.owner)
}

/** The video owner makes a restricted person's comment visible to everyone. */
export const approveComment = async (params: CommentParamsDto, actor: AuthUser): Promise<CommentResponseDto> => {
  const video = await findVideoOrFail(params.videoId, actor.id)
  if (!isSameId(video.owner, actor.id)) throw forbidden(MESSAGES.AUTH.FORBIDDEN)
  const comment = await findCommentOrFail(params)
  if (comment.visibility !== CommentVisibility.RESTRICTED) throw conflict(MESSAGES.COMMENTS.NOT_PENDING)
  await withTransaction(async () => {
    await commentRepository.updateById(params.commentId, { $set: { visibility: CommentVisibility.PUBLIC } }, actor.id)
    await applyCommentCounters({ ...comment.toObject(), visibility: CommentVisibility.PUBLIC }, 1)
  })
  return getCommentResponse(params.commentId, video.owner)
}
