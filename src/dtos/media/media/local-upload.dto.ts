import { z } from 'zod'
import { REGEX } from '../../../constants/common/regex.constants'

/** The multipart fields ImageKit's upload API takes, mirrored by the local provider. */
export const localUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  folder: z.string().regex(REGEX.MEDIA_FOLDER),
  token: z.string().min(1).max(100),
  expire: z.coerce.number().int().positive(),
  signature: z.string().min(1).max(100),
  isPrivateFile: z.enum(['true', 'false']).default('false').transform((value) => value === 'true')
})

export type LocalUploadDto = z.infer<typeof localUploadSchema>
