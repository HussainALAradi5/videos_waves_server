import type { Types } from 'mongoose'
import type { MessageKind } from '../../../../enums/chat/message/message-kind.enum'

/** Copied onto the conversation on every send, so the inbox renders without loading messages. */
export interface LastMessageSnapshot {
  message: Types.ObjectId
  sender: Types.ObjectId
  kind: MessageKind
  preview: string
  createdAt: Date
}
