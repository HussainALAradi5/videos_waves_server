import { z } from 'zod'
import { CONVERSATION_SORT_FIELDS } from '../../../constants/chat/conversation/conversation.constants'
import { InboxFolder } from '../../../enums/chat/conversation/inbox-folder.enum'
import { buildPageRequestSchema, searchSchema } from '../../../validations/common/pagination.validation'

export const conversationQuerySchema = buildPageRequestSchema(CONVERSATION_SORT_FIELDS, 'lastMessageAt').extend({
  folder: z.enum(InboxFolder).default(InboxFolder.INBOX),
  search: searchSchema
})

export type ConversationQueryDto = z.infer<typeof conversationQuerySchema>
