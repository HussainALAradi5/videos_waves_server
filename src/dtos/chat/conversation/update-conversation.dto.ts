import { ChatBackground } from '../../../enums/chat/conversation/chat-background.enum'
import { z } from 'zod'
import { MuteDuration } from '../../../enums/chat/conversation/mute-duration.enum'
import { groupTitleSchema } from '../../../validations/chat/conversation/conversation.validation'

/** Rename (groups, admins only); mute and background (any member, only for themselves). */
export const updateConversationSchema = z
  .object({
    title: groupTitleSchema.optional(),
    /** 8 hours, a week, until unmuted, or off. */
    mute: z.enum(MuteDuration).optional(),
    /** Older clients: true mutes until unmuted, false unmutes. */
    isMuted: z.boolean().optional(),
    /** Your own wallpaper for this chat; nobody else sees it. */
    background: z.enum(ChatBackground).optional()
  })
  .strict()
  .refine((dto) => Object.keys(dto).length > 0, { message: 'Provide at least one field to update.' })

export type UpdateConversationDto = z.infer<typeof updateConversationSchema>
