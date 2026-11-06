import { z } from 'zod'
import { VIDEO_LIMITS } from '../../../constants/videos/video/video.constants'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

/** The file is uploaded first (POST /media/signature, provider upload, POST /media); this links it. */
export const createVideoSchema = z.object({
  mediaId: objectIdSchema,
  title: z.string().trim().min(VIDEO_LIMITS.TITLE_MIN).max(VIDEO_LIMITS.TITLE_MAX),
  description: z.string().trim().max(VIDEO_LIMITS.DESCRIPTION_MAX).default('')
})

export type CreateVideoDto = z.infer<typeof createVideoSchema>
