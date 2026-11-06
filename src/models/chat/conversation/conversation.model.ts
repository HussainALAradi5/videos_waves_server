import { Schema, model } from 'mongoose'
import { CONVERSATION_CODE_PREFIX, CONVERSATION_LIMITS } from '../../../constants/chat/conversation/conversation.constants'
import { ConversationType } from '../../../enums/chat/conversation/conversation-type.enum'
import { MessageKind } from '../../../enums/chat/message/message-kind.enum'
import type { Conversation } from '../../../interfaces/models/chat/conversation/conversation.interface'
import { baseEntityPlugin } from '../../base/base-entity.model'

const lastMessageSchema = new Schema(
  {
    message: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: Object.values(MessageKind), required: true },
    preview: { type: String, default: '' },
    createdAt: { type: Date, required: true }
  },
  { _id: false }
)

const conversationSchema = new Schema<Conversation>({
  type: { type: String, enum: Object.values(ConversationType), required: true },
  title: { type: String, default: null, trim: true, maxlength: CONVERSATION_LIMITS.TITLE_MAX },
  directKey: { type: String, default: null },
  lastMessage: { type: lastMessageSchema, default: null },
  lastMessageAt: { type: Date, default: null },
  membersCount: { type: Number, default: 0, min: 0 }
})

conversationSchema.plugin(baseEntityPlugin, { codePrefix: CONVERSATION_CODE_PREFIX })
// Exactly one direct chat per pair of people.
conversationSchema.index(
  { directKey: 1 },
  { unique: true, partialFilterExpression: { directKey: { $type: 'string' } } }
)
conversationSchema.index({ lastMessageAt: -1 })

export const ConversationModel = model<Conversation>('Conversation', conversationSchema)
