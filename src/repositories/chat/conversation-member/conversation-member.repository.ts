import type { QueryFilter } from 'mongoose'
import { MemberRole } from '../../../enums/chat/conversation/member-role.enum'
import { MemberStatus } from '../../../enums/chat/conversation/member-status.enum'
import type { ConversationMember } from '../../../interfaces/models/chat/conversation-member/conversation-member.interface'
import { ConversationMemberModel } from '../../../models/chat/conversation-member/conversation-member.model'
import { BaseRepository } from '../../base/base.repository'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

class ConversationMemberRepository extends BaseRepository<ConversationMember> {
  constructor() {
    super(ConversationMemberModel)
  }

  /** A current (not left) membership. */
  findActive(conversationId: string, userId: string) {
    return this.model.findOne(
      this.active({ conversation: toObjectId(conversationId), user: toObjectId(userId), leftAt: null })
    )
  }

  /** Any membership, including one the user left (they keep read access to the history before leaving). */
  findAny(conversationId: string, userId: string) {
    return this.model.findOne(this.active({ conversation: toObjectId(conversationId), user: toObjectId(userId) }))
  }

  /** Current members of each conversation in one query, for a whole inbox page. */
  findActiveForConversations(conversationIds: string[]) {
    return this.model
      .find(this.active({ conversation: { $in: conversationIds.map(toObjectId) }, leftAt: null }))
      .sort({ createdAt: 1 })
      .lean()
  }

  async findActiveUserIds(conversationId: string): Promise<string[]> {
    const rows = await this.model.find(this.active({ conversation: toObjectId(conversationId), leftAt: null }), 'user').lean()
    return rows.map((row) => row.user.toString())
  }

  /** My active conversation ids, for inbox search. */
  async findConversationIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.model.find(this.active({ user: toObjectId(userId), leftAt: null }), 'conversation').lean()
    return rows.map((row) => row.conversation.toString())
  }

  /** Conversations among `conversationIds` that include any of `userIds` (search by participant name). */
  async findConversationIdsWithUsers(conversationIds: string[], userIds: string[]): Promise<string[]> {
    const rows = await this.model
      .find(
        this.active({
          conversation: { $in: conversationIds.map(toObjectId) },
          user: { $in: userIds.map(toObjectId) },
          leftAt: null
        }),
        'conversation'
      )
      .lean()
    return [...new Set(rows.map((row) => row.conversation.toString()))]
  }

  /** On every new message: others get +1 unread, and everyone sees the chat again if they had hidden it. */
  async recordNewMessage(conversationId: string, senderId: string, at: Date): Promise<void> {
    const conversation = toObjectId(conversationId)
    const sender = toObjectId(senderId)
    await this.model.updateMany(this.active({ conversation, leftAt: null }), {
      $set: { lastMessageAt: at, hiddenAt: null }
    })
    await this.model.updateMany(this.active({ conversation, leftAt: null, user: { $ne: sender } }), {
      $inc: { unreadCount: 1 }
    })
    await this.model.updateOne({ conversation, user: sender }, { $set: { lastReadAt: at, unreadCount: 0 } })
  }

  async markRead(conversationId: string, userId: string, at: Date): Promise<void> {
    await this.model.updateOne(
      { conversation: toObjectId(conversationId), user: toObjectId(userId) },
      { $set: { lastReadAt: at, unreadCount: 0 } }
    )
  }

  /** Unread messages across accepted, unmuted chats, for the Messages badge. */
  async totalUnread(userId: string): Promise<number> {
    const [result] = await this.model.aggregate<{ total: number }>([
      {
        $match: {
          user: toObjectId(userId),
          deletedAt: null,
          leftAt: null,
          hiddenAt: null,
          status: MemberStatus.ACCEPTED,
          $or: [{ mutedUntil: null }, { mutedUntil: { $lt: new Date() } }]
        }
      },
      { $group: { _id: null, total: { $sum: '$unreadCount' } } }
    ])
    return result?.total ?? 0
  }

  async countAdmins(conversationId: string): Promise<number> {
    return this.model.countDocuments(
      this.active({ conversation: toObjectId(conversationId), leftAt: null, role: MemberRole.ADMIN })
    )
  }

  /** The longest-standing remaining member, promoted when the last admin leaves. */
  findOldestMember(conversationId: string) {
    return this.model
      .findOne(this.active({ conversation: toObjectId(conversationId), leftAt: null, role: MemberRole.MEMBER }))
      .sort({ createdAt: 1 })
  }

  inboxFilter(userId: string, extra: QueryFilter<ConversationMember>): QueryFilter<ConversationMember> {
    return { user: toObjectId(userId), leftAt: null, hiddenAt: null, ...extra }
  }
}

export const conversationMemberRepository = new ConversationMemberRepository()
