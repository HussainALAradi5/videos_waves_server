import type { z } from 'zod'
import { objectIdSchema } from '../../../validations/common/object-id.validation'
import { commentBodySchema } from './comment-body.dto'

/** A new comment, or with `parentId` a reply (a reply to a reply joins the same top-level thread). */
export const createCommentSchema = commentBodySchema.extend({ parentId: objectIdSchema.optional() })

export type CreateCommentDto = z.infer<typeof createCommentSchema>
