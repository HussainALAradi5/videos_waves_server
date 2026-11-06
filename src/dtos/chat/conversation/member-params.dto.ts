import { z } from 'zod'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

export const memberParamsSchema = z.object({ conversationId: objectIdSchema, userId: objectIdSchema })

export type MemberParamsDto = z.infer<typeof memberParamsSchema>
