import { z } from 'zod'
import { MediaKind } from '../../../enums/media/media/media-kind.enum'

export const registerMediaSchema = z.object({
  fileId: z.string().trim().min(1).max(200),
  kind: z.enum(MediaKind),
  originalName: z.string().trim().max(255).default('')
})

export type RegisterMediaDto = z.infer<typeof registerMediaSchema>
