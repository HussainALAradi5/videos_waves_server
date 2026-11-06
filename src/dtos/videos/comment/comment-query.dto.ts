import type { z } from 'zod'
import { COMMENT_SORT_FIELDS } from '../../../constants/videos/comment/comment.constants'
import { buildPageRequestSchema } from '../../../validations/common/pagination.validation'

export const commentQuerySchema = buildPageRequestSchema(COMMENT_SORT_FIELDS, 'createdAt')

export type CommentQueryDto = z.infer<typeof commentQuerySchema>
