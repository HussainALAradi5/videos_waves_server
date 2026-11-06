import { NotificationKind } from '../../../enums/notifications/notification/notification-kind.enum'
import { notify } from '../../notifications/notification/notification.service'
import type { HydratedDocument, QueryFilter, Types } from 'mongoose'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { USER_PUBLIC_FIELDS } from '../../../constants/users/user/user.constants'
import { CommentVisibility } from '../../../enums/videos/comment/comment-visibility.enum'
import type { CommentBodyDto } from '../../../dtos/videos/comment/comment-body.dto'
import type { CommentQueryDto } from '../../../dtos/videos/comment/comment-query.dto'
import type { CommentParamsDto } from '../../../dtos/videos/comment/comment-params.dto'
import type { CommentResponseDto } from '../../../dtos/videos/comment/comment-response.dto'
import type { CreateCommentDto } from '../../../dtos/videos/comment/create-comment.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { Comment } from '../../../interfaces/models/videos/comment/comment.interface'
import type { CommentWithAuthor } from '../../../interfaces/models/videos/comment/comment-with-author.interface'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import type { PageResult } from '../../../interfaces/common/pagination/page-result.interface'
import { commentRepository } from '../../../repositories/videos/comment/comment.repository'
import { videoRepository } from '../../../repositories/videos/video/video.repository'
import { toCommentResponse } from '../../../mappers/videos/comment/comment.mapper'
import { assertCanManage } from '../../../validations/common/ownership.validation'
import { notFound } from '../../../utilities/errors/app-error.utility'
import { isSameId, toObjectId } from '../../../utilities/ids/object-id.utility'
import { withTransaction } from '../../../utilities/database/transaction.utility'
import { getHiddenUserIds } from '../../users/visibility/visibility.service'
import { isRestrictedBy } from '../../users/restriction/restriction.service'
import { findVideoOrFail } from '../video/video.service'

const AUTHOR_POPULATE = { path: 'author', select: USER_PUBLIC_FIELDS }

export const findCommentOrFail = async (params: CommentParamsDto) => {
  const comment = await commentRepository.findInVideo(params.videoId, params.commentId)
  if (!comment) throw notFound(MESSAGES.COMMENTS.NOT_FOUND)
  return comment
}

export const getCommentResponse = async (commentId: string, videoOwnerId: Types.ObjectId): Promise<CommentResponseDto> => {
  const comment = await commentRepository.findById(commentId).populate<{ author: PublicUserSource }>(AUTHOR_POPULATE)
  if (!comment) throw notFound(MESSAGES.COMMENTS.NOT_FOUND)
  return toCommentResponse(comment, videoOwnerId)
}

/**
 * Keeps counters equal to what everyone can see: public comments only. A top-level comment carries
 * its public replies with it. Call inside the transaction that changes the comment.
 */
export const applyCommentCounters = async (comment: Comment, direction: 1 | -1): Promise<void> => {
  if (comment.visibility !== CommentVisibility.PUBLIC) return
  const thread = comment.parent ? 1 : 1 + comment.repliesCount
  await videoRepository.incrementCounter(comment.video.toString(), 'commentsCount', direction * thread)
  if (comment.parent) await commentRepository.incrementCounter(comment.parent.toString(), 'repliesCount', direction)
}

/**
 * Public comments plus, for a signed-in viewer, their own restricted comments; the video owner sees
 * every restricted comment (to approve or delete). Authors hidden by a block never appear.
 */
const buildVisibleFilter = async (
  videoOwnerId: Types.ObjectId,
  parentId: string | null,
  viewerId?: string
): Promise<QueryFilter<Comment>> => {
  const hidden = (await getHiddenUserIds(viewerId)).map(toObjectId)
  const filter: QueryFilter<Comment> = { parent: parentId ? toObjectId(parentId) : null }
  if (hidden.length > 0) filter.author = { $nin: hidden }
  if (!isSameId(videoOwnerId, viewerId ?? '')) {
    filter.$or = [
      { visibility: CommentVisibility.PUBLIC },
      ...(viewerId ? [{ author: toObjectId(viewerId) }] : [])
    ]
  }
  return filter
}

const listThread = async (
  videoId: string,
  parentId: string | null,
  query: CommentQueryDto,
  viewerId?: string
): Promise<PageResult<CommentResponseDto>> => {
  const video = await findVideoOrFail(videoId, viewerId, true)
  const filter = { ...(await buildVisibleFilter(video.owner, parentId, viewerId)), video: video._id }
  const page = await commentRepository.paginate<CommentWithAuthor>(filter, query, { populate: AUTHOR_POPULATE })
  return { items: page.items.map((comment) => toCommentResponse(comment, video.owner)), meta: page.meta }
}

export const listComments = (videoId: string, query: CommentQueryDto, viewerId?: string) =>
  listThread(videoId, null, query, viewerId)

export const listReplies = async (params: CommentParamsDto, query: CommentQueryDto, viewerId?: string) => {
  const parent = await findCommentOrFail(params)
  return listThread(params.videoId, parent.parent?.toString() ?? parent._id.toString(), query, viewerId)
}

/** The thread root for a new reply: a reply to a reply joins the same top-level comment. */
const resolveParent = async (videoId: string, parentId?: string): Promise<HydratedDocument<Comment> | null> => {
  if (!parentId) return null
  const parent = await findCommentOrFail({ videoId, commentId: parentId })
  if (!parent.parent) return parent
  return findCommentOrFail({ videoId, commentId: parent.parent.toString() })
}

/** Someone the video owner restricted gets a pending comment that only they and the owner can see. */
export const createComment = async (
  videoId: string,
  dto: CreateCommentDto,
  actor: AuthUser
): Promise<CommentResponseDto> => {
  const video = await findVideoOrFail(videoId, actor.id)
  const parent = await resolveParent(videoId, dto.parentId)
  const isRestricted = await isRestrictedBy(video.owner.toString(), actor.id)
  const comment = await withTransaction(async () => {
    const created = await commentRepository.create(
      {
        video: video._id,
        author: toObjectId(actor.id),
        parent: parent?._id ?? null,
        content: dto.content,
        visibility: isRestricted ? CommentVisibility.RESTRICTED : CommentVisibility.PUBLIC
      },
      actor.id
    )
    await applyCommentCounters(created, 1)
    return created
  })
  // A restricted person's pending comment stays quiet until the owner approves it.
  if (!isRestricted) {
    if (parent) {
      await notify({ userId: parent.author.toString(), kind: NotificationKind.REPLY, actorId: actor.id, targetId: videoId, subject: video.title })
    }
    if (!parent || !isSameId(parent.author, video.owner.toString())) {
      await notify({ userId: video.owner.toString(), kind: NotificationKind.COMMENT, actorId: actor.id, targetId: videoId, subject: video.title })
    }
  }
  return getCommentResponse(comment._id.toString(), video.owner)
}

/** Only the author may edit their words; admins and the video owner may not rewrite them. */
export const updateComment = async (
  params: CommentParamsDto,
  dto: CommentBodyDto,
  actor: AuthUser
): Promise<CommentResponseDto> => {
  const video = await findVideoOrFail(params.videoId, actor.id)
  const comment = await findCommentOrFail(params)
  assertCanManage(comment.author, actor, false)
  if (comment.content !== dto.content) {
    await commentRepository.updateById(params.commentId, { $set: { content: dto.content, editedAt: new Date() } }, actor.id)
  }
  return getCommentResponse(params.commentId, video.owner)
}
