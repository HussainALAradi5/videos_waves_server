import { z } from 'zod'
import { VIDEO_LIMITS } from '../../../constants/videos/video/video.constants'

export const createVideoSchema = z.object({
  title: z.string().trim().min(VIDEO_LIMITS.TITLE_MIN).max(VIDEO_LIMITS.TITLE_MAX),
  description: z.string().trim().max(VIDEO_LIMITS.DESCRIPTION_MAX).default('')
})

export type CreateVideoDto = z.infer<typeof createVideoSchema>
