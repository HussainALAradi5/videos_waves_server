import { z } from 'zod'
import { COMMENT_LIMITS } from '../../../constants/videos/comment/comment.constants'

// Create and edit share the same body: the comment text.
export const commentBodySchema = z.object({
  content: z.string().trim().min(COMMENT_LIMITS.CONTENT_MIN).max(COMMENT_LIMITS.CONTENT_MAX)
})

export type CommentBodyDto = z.infer<typeof commentBodySchema>
