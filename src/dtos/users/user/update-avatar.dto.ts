import { z } from 'zod'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

/** A pending avatar upload to use, or null to remove the current avatar. */
export const updateAvatarSchema = z.object({ mediaId: objectIdSchema.nullable() })

export type UpdateAvatarDto = z.infer<typeof updateAvatarSchema>
