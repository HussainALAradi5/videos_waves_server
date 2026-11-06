import { Schema, model } from 'mongoose'
import { MESSAGE_REACTION_CODE_PREFIX, MESSAGE_REACTIONS } from '../../../constants/chat/message/message.constants'
import type { MessageReaction } from '../../../interfaces/models/chat/message-reaction/message-reaction.interface'
import { baseEntityPlugin } from '../../base/base-entity.plugin'

const reactionSchema = new Schema<MessageReaction>({
  message: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  emoji: { type: String, enum: MESSAGE_REACTIONS, required: true }
})

reactionSchema.plugin(baseEntityPlugin, { codePrefix: MESSAGE_REACTION_CODE_PREFIX })
// One reaction per person per message; reacting again replaces it.
reactionSchema.index({ message: 1, user: 1 }, { unique: true })

export const MessageReactionModel = model<MessageReaction>('MessageReaction', reactionSchema)
