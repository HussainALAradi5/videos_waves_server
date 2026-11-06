import { z } from 'zod'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

export const mediaParamsSchema = z.object({ mediaId: objectIdSchema })

export type MediaParamsDto = z.infer<typeof mediaParamsSchema>
