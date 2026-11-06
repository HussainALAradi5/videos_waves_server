import { z } from 'zod'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

export const commentParamsSchema = z.object({ videoId: objectIdSchema, commentId: objectIdSchema })

export type CommentParamsDto = z.infer<typeof commentParamsSchema>
