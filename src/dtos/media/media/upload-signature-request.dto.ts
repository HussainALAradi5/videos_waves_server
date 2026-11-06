import { z } from 'zod'
import { MediaKind } from '../../../enums/media/media/media-kind.enum'

export const uploadSignatureRequestSchema = z.object({ kind: z.enum(MediaKind) })

export type UploadSignatureRequestDto = z.infer<typeof uploadSignatureRequestSchema>
