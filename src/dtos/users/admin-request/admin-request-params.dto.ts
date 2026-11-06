import { z } from 'zod'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

export const adminRequestParamsSchema = z.object({ requestId: objectIdSchema })

export type AdminRequestParamsDto = z.infer<typeof adminRequestParamsSchema>
