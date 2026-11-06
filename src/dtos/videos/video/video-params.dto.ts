import { z } from 'zod'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

export const videoParamsSchema = z.object({ videoId: objectIdSchema })

export type VideoParamsDto = z.infer<typeof videoParamsSchema>
