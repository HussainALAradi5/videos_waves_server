import type { Types } from 'mongoose'
import type { MessageReaction } from '../../../interfaces/models/chat/message-reaction/message-reaction.interface'
import type { ReactionSummary } from '../../../interfaces/models/chat/message-reaction/reaction-summary.interface'
import { MessageReactionModel } from '../../../models/chat/message-reaction/message-reaction.model'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

class MessageReactionRepository extends BaseRepository<MessageReaction> {
  constructor() {
    super(MessageReactionModel)
  }

  /** Sets (or replaces) this person's reaction. */
  async setReaction(messageId: string, conversationId: string, userId: string, emoji: string): Promise<void> {
    const user = toObjectId(userId)
    await this.model.updateOne(
      { message: toObjectId(messageId), user },
      { $set: { emoji, updatedBy: user }, $setOnInsert: { conversation: toObjectId(conversationId), createdBy: user } },
      { upsert: true, runValidators: true }
    )
  }

  async removeReaction(messageId: string, userId: string): Promise<void> {
    await this.model.deleteOne({ message: toObjectId(messageId), user: toObjectId(userId) })
  }

  async removeAllForMessage(messageId: string): Promise<void> {
    await this.model.deleteMany({ message: toObjectId(messageId) })
  }

  /** Reaction counts per message for a whole page, plus the viewer's own choice, in one query. */
  async summarize(messageIds: Types.ObjectId[], viewerId: string): Promise<Map<string, ReactionSummary>> {
    const rows = await this.model.find({ message: { $in: messageIds } }, 'message user emoji').lean()
    const summaries = new Map<string, ReactionSummary>()
    for (const row of rows) {
      const key = row.message.toString()
      const summary = summaries.get(key) ?? { counts: new Map<string, number>(), mine: null }
      summary.counts.set(row.emoji, (summary.counts.get(row.emoji) ?? 0) + 1)
      if (row.user.toString() === viewerId) summary.mine = row.emoji
      summaries.set(key, summary)
    }
    return summaries
  }
}

export const messageReactionRepository = new MessageReactionRepository()
