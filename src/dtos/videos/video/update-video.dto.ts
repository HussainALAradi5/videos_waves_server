import { z } from 'zod'
import { VIDEO_LIMITS } from '../../../constants/videos/video/video.constants'

export const updateVideoSchema = z
  .object({
    title: z.string().trim().min(VIDEO_LIMITS.TITLE_MIN).max(VIDEO_LIMITS.TITLE_MAX).optional(),
    description: z.string().trim().max(VIDEO_LIMITS.DESCRIPTION_MAX).optional()
  })
  .strict()
  .refine((dto) => Object.keys(dto).length > 0, { message: 'Provide at least one field to update.' })

export type UpdateVideoDto = z.infer<typeof updateVideoSchema>
