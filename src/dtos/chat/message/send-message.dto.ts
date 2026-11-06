import { z } from 'zod'
import { MESSAGE_LIMITS } from '../../../constants/chat/message/message.constants'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { objectIdSchema } from '../../../validations/common/object-id.validation'

/**
 * A message is text, attachments (pending chat_attachment media), one voice note (pending
 * voice_note media), or a shared video; text may accompany attachments or a shared video.
 */
export const sendMessageSchema = z
  .object({
    body: z.string().trim().min(1).max(MESSAGE_LIMITS.BODY_MAX).optional(),
    attachmentIds: z.array(objectIdSchema).min(1).max(MESSAGE_LIMITS.MAX_ATTACHMENTS).optional(),
    voiceNoteId: objectIdSchema.optional(),
    sharedVideoId: objectIdSchema.optional(),
    replyToId: objectIdSchema.optional()
  })
  .refine((dto) => dto.body || dto.attachmentIds || dto.voiceNoteId || dto.sharedVideoId, {
    message: MESSAGES.CHAT.MESSAGE_EMPTY
  })
  .refine((dto) => !dto.voiceNoteId || (!dto.body && !dto.attachmentIds && !dto.sharedVideoId), {
    message: MESSAGES.CHAT.VOICE_NOTE_ALONE
  })

export type SendMessageDto = z.infer<typeof sendMessageSchema>
