import { ChatBackground } from '../../../enums/chat/conversation/chat-background.enum'
import { Schema, model } from 'mongoose'
import { CONVERSATION_MEMBER_CODE_PREFIX } from '../../../constants/chat/conversation/conversation.constants'
import { MemberRole } from '../../../enums/chat/conversation/member-role.enum'
import { MemberStatus } from '../../../enums/chat/conversation/member-status.enum'
import type { ConversationMember } from '../../../interfaces/models/chat/conversation-member/conversation-member.interface'
import { baseEntityPlugin } from '../../base/base-entity.model'

const memberSchema = new Schema<ConversationMember>({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: Object.values(MemberRole), default: MemberRole.MEMBER },
  status: { type: String, enum: Object.values(MemberStatus), default: MemberStatus.ACCEPTED },
  lastReadAt: { type: Date, default: null },
  lastMessageAt: { type: Date, default: null },
  unreadCount: { type: Number, default: 0, min: 0 },
  mutedUntil: { type: Date, default: null },
  background: { type: String, enum: Object.values(ChatBackground), default: ChatBackground.NONE },
  leftAt: { type: Date, default: null },
  hiddenAt: { type: Date, default: null }
})

memberSchema.plugin(baseEntityPlugin, { codePrefix: CONVERSATION_MEMBER_CODE_PREFIX })
memberSchema.index({ conversation: 1, user: 1 }, { unique: true })
// The inbox: my active memberships by folder.
memberSchema.index({ user: 1, leftAt: 1, hiddenAt: 1, status: 1, lastMessageAt: -1 })

export const ConversationMemberModel = model<ConversationMember>('ConversationMember', memberSchema)
