import { Schema, model } from 'mongoose'
import { MESSAGE_CODE_PREFIX, MESSAGE_LIMITS } from '../../../constants/chat/message/message.constants'
import { MessageKind } from '../../../enums/chat/message/message-kind.enum'
import { SystemAction } from '../../../enums/chat/message/system-action.enum'
import type { Message } from '../../../interfaces/models/chat/message/message.interface'
import { baseEntityPlugin } from '../../base/base-entity.plugin'

const messageSchema = new Schema<Message>({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  kind: { type: String, enum: Object.values(MessageKind), required: true },
  body: { type: String, default: null, maxlength: MESSAGE_LIMITS.BODY_MAX },
  attachments: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
  replyTo: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
  sharedVideo: { type: Schema.Types.ObjectId, ref: 'Video', default: null },
  systemAction: { type: String, enum: [...Object.values(SystemAction), null], default: null },
  systemTarget: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  editedAt: { type: Date, default: null },
  unsentAt: { type: Date, default: null },
  deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }]
})

messageSchema.plugin(baseEntityPlugin, { codePrefix: MESSAGE_CODE_PREFIX })
// The thread, newest first, paged by _id cursor.
messageSchema.index({ conversation: 1, _id: -1 })

export const MessageModel = model<Message>('Message', messageSchema)
