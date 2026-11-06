import { z } from 'zod'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

export const sessionParamsSchema = z.object({ sessionId: objectIdSchema })

export type SessionParamsDto = z.infer<typeof sessionParamsSchema>
