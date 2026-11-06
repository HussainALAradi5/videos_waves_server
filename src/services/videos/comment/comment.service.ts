import { MESSAGES } from '../../../constants/common/messages.constants'
import { USER_PUBLIC_FIELDS } from '../../../constants/users/user/user.constants'
import type { CommentBodyDto } from '../../../dtos/videos/comment/comment-body.dto'
import type { CommentQueryDto } from '../../../dtos/videos/comment/comment-query.dto'
import type { CommentParamsDto } from '../../../dtos/videos/comment/comment-params.dto'
import type { CommentResponseDto } from '../../../dtos/videos/comment/comment-response.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { CommentWithAuthor } from '../../../interfaces/models/videos/comment/comment-with-author.interface'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import type { PageResult } from '../../../interfaces/common/pagination/page-result.interface'
import { commentRepository } from '../../../repositories/videos/comment/comment.repository'
import { videoRepository } from '../../../repositories/videos/video/video.repository'
import { toCommentResponse } from '../../../mappers/videos/comment/comment.mapper'
import { assertCanManage } from '../../../validations/common/ownership.validation'
import { notFound } from '../../../utilities/errors/app-error.utility'
import { toObjectId } from '../../../utilities/ids/object-id.utility'
import { findVideoOrFail } from '../video/video.service'
import { withTransaction } from '../../../utilities/database/transaction.utility'

const AUTHOR_POPULATE = { path: 'author', select: USER_PUBLIC_FIELDS }

const findCommentOrFail = async (params: CommentParamsDto) => {
  const comment = await commentRepository.findInVideo(params.videoId, params.commentId)
  if (!comment) throw notFound(MESSAGES.COMMENTS.NOT_FOUND)
  return comment
}

const getCommentResponse = async (commentId: string): Promise<CommentResponseDto> => {
  const comment = await commentRepository.findById(commentId).populate<{ author: PublicUserSource }>(AUTHOR_POPULATE)
  if (!comment) throw notFound(MESSAGES.COMMENTS.NOT_FOUND)
  return toCommentResponse(comment)
}

export const listComments = async (
  videoId: string,
  query: CommentQueryDto
): Promise<PageResult<CommentResponseDto>> => {
  await findVideoOrFail(videoId)
  const page = await commentRepository.paginate<CommentWithAuthor>({ video: toObjectId(videoId) }, query, {
    populate: AUTHOR_POPULATE
  })
  return { items: page.items.map(toCommentResponse), meta: page.meta }
}

export const createComment = async (
  videoId: string,
  dto: CommentBodyDto,
  actor: AuthUser
): Promise<CommentResponseDto> => {
  await findVideoOrFail(videoId)
  const comment = await withTransaction(async () => {
    const created = await commentRepository.create(
      { video: toObjectId(videoId), author: toObjectId(actor.id), content: dto.content },
      actor.id
    )
    await videoRepository.incrementCounter(videoId, 'commentsCount', 1)
    return created
  })
  return getCommentResponse(comment._id.toString())
}

/** Only the author may edit their words; admins may not rewrite them. */
export const updateComment = async (
  params: CommentParamsDto,
  dto: CommentBodyDto,
  actor: AuthUser
): Promise<CommentResponseDto> => {
  const comment = await findCommentOrFail(params)
  assertCanManage(comment.author, actor, false)
  await commentRepository.updateById(params.commentId, { $set: { content: dto.content } }, actor.id)
  return getCommentResponse(params.commentId)
}

/** The author or an admin may delete (moderation). */
export const deleteComment = async (params: CommentParamsDto, actor: AuthUser): Promise<void> => {
  const comment = await findCommentOrFail(params)
  assertCanManage(comment.author, actor, true)
  await withTransaction(async () => {
    if (await commentRepository.softDeleteById(params.commentId, actor.id)) {
      await videoRepository.incrementCounter(params.videoId, 'commentsCount', -1)
    }
  })
}
