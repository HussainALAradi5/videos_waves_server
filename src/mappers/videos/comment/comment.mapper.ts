import type { Types } from 'mongoose'
import { CommentVisibility } from '../../../enums/videos/comment/comment-visibility.enum'
import type { CommentWithAuthor } from '../../../interfaces/models/videos/comment/comment-with-author.interface'
import type { CommentResponseDto } from '../../../dtos/videos/comment/comment-response.dto'
import { isSameId } from '../../../utilities/ids/object-id.utility'
import { toPublicUser } from '../../users/user/user.mapper'

export const toCommentResponse = (comment: CommentWithAuthor, videoOwnerId: Types.ObjectId): CommentResponseDto => ({
  id: comment._id.toString(),
  code: comment.code,
  videoId: comment.video.toString(),
  parentId: comment.parent?.toString() ?? null,
  content: comment.content,
  author: toPublicUser(comment.author),
  isVideoOwner: isSameId(videoOwnerId, comment.author._id.toString()),
  isEdited: comment.editedAt !== null,
  isPendingApproval: comment.visibility === CommentVisibility.RESTRICTED,
  repliesCount: comment.repliesCount,
  createdAt: comment.createdAt.toISOString(),
  updatedAt: comment.updatedAt.toISOString()
})
