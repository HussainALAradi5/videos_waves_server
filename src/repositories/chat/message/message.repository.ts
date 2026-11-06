import type { QueryFilter } from 'mongoose'
import type { Message } from '../../../interfaces/models/chat/message/message.interface'
import type { ConversationMember } from '../../../interfaces/models/chat/conversation-member/conversation-member.interface'
import { MessageModel } from '../../../models/chat/message/message.model'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

class MessageRepository extends BaseRepository<Message> {
  constructor() {
    super(MessageModel)
  }

  /**
   * One cursor page of a thread as `member` may see it: from when they joined until they left,
   * without messages they deleted for themselves. Fetches `pageSize + 1` rows (see buildCursorPage).
   */
  findThreadPage(member: ConversationMember, before: string | undefined, pageSize: number) {
    const idRange: Record<string, unknown> = {}
    if (before) idRange.$lt = toObjectId(before)
    const createdAt: Record<string, Date> = { $gte: member.createdAt }
    if (member.leftAt) createdAt.$lte = member.leftAt
    const filter: QueryFilter<Message> = {
      conversation: member.conversation,
      deletedFor: { $ne: member.user },
      createdAt,
      ...(before ? { _id: idRange } : {})
    }
    return this.model.find(this.active(filter)).sort({ _id: -1 }).limit(pageSize + 1)
  }

  findInConversation(conversationId: string, messageId: string) {
    return this.model.findOne(this.active({ _id: toObjectId(messageId), conversation: toObjectId(conversationId) }))
  }

  /** The newest message everyone can still see, to refresh the inbox preview after an unsend. */
  findLatestVisible(conversationId: string) {
    return this.model.findOne(this.active({ conversation: toObjectId(conversationId), unsentAt: null })).sort({ _id: -1 })
  }

  async hideFor(messageId: string, userId: string): Promise<void> {
    await this.model.updateOne({ _id: toObjectId(messageId) }, { $addToSet: { deletedFor: toObjectId(userId) } })
  }
}

export const messageRepository = new MessageRepository()
