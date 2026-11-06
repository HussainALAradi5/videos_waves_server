import type { Conversation } from '../../../interfaces/models/chat/conversation/conversation.interface'
import type { LastMessageSnapshot } from '../../../interfaces/models/chat/conversation/last-message-snapshot.interface'
import { ConversationModel } from '../../../models/chat/conversation/conversation.model'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

class ConversationRepository extends BaseRepository<Conversation> {
  constructor() {
    super(ConversationModel)
  }

  findMany(conversationIds: string[]) {
    return this.model.find(this.active({ _id: { $in: conversationIds.map(toObjectId) } })).lean()
  }

  findByDirectKey(directKey: string) {
    return this.model.findOne(this.active({ directKey }))
  }

  async setLastMessage(conversationId: string, snapshot: LastMessageSnapshot | null): Promise<void> {
    await this.model.updateOne(
      { _id: toObjectId(conversationId) },
      { $set: { lastMessage: snapshot, ...(snapshot ? { lastMessageAt: snapshot.createdAt } : {}) } }
    )
  }

  async findIdsByType(conversationIds: string[], type: Conversation['type']): Promise<string[]> {
    const rows = await this.model.find(this.active({ _id: { $in: conversationIds.map(toObjectId) }, type }), '_id').lean()
    return rows.map((row) => row._id.toString())
  }

  /** Group ids among `conversationIds` whose title matches `pattern` (inbox search). */
  async findGroupIdsByTitle(conversationIds: string[], pattern: RegExp): Promise<string[]> {
    const rows = await this.model.find(this.active({ _id: { $in: conversationIds.map(toObjectId) }, title: pattern }), '_id').lean()
    return rows.map((row) => row._id.toString())
  }
}

export const conversationRepository = new ConversationRepository()
