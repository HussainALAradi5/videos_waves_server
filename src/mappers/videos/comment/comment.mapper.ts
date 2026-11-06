import type { CommentWithAuthor } from '../../../interfaces/models/videos/comment/comment-with-author.interface'
import type { CommentResponseDto } from '../../../dtos/videos/comment/comment-response.dto'
import { toPublicUser } from '../../users/user/user.mapper'

export const toCommentResponse = (comment: CommentWithAuthor): CommentResponseDto => ({
  id: comment._id.toString(),
  code: comment.code,
  videoId: comment.video.toString(),
  content: comment.content,
  author: toPublicUser(comment.author),
  createdAt: comment.createdAt.toISOString(),
  updatedAt: comment.updatedAt.toISOString()
})
