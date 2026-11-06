import { z } from 'zod'
import { groupTitleSchema } from '../../../validations/chat/conversation/conversation.validation'

/** Rename (groups, admins only) and mute (any member, only for themselves). */
export const updateConversationSchema = z
  .object({ title: groupTitleSchema.optional(), isMuted: z.boolean().optional() })
  .strict()
  .refine((dto) => Object.keys(dto).length > 0, { message: 'Provide at least one field to update.' })

export type UpdateConversationDto = z.infer<typeof updateConversationSchema>
