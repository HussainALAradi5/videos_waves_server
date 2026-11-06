import { ChatEvent } from '../../../enums/chat/realtime/chat-event.enum'
import { ConversationType } from '../../../enums/chat/conversation/conversation-type.enum'
import type { TypingEventDto } from '../../../dtos/chat/realtime/typing-event.dto'
import { conversationRepository } from '../../../repositories/chat/conversation/conversation.repository'
import { conversationMemberRepository } from '../../../repositories/chat/conversation-member/conversation-member.repository'
import { restrictionRepository } from '../../../repositories/users/restriction/restriction.repository'
import { emitToUsers } from './chat-events.service'

/** Removes people `userId` restricted: they must not see that user's activity (typing, online, seen). */
const withoutRestricted = async (userId: string, recipientIds: string[]): Promise<string[]> => {
  const restricted = await restrictionRepository.findTargetIds(userId, recipientIds)
  return recipientIds.filter((id) => !restricted.has(id))
}

/** Relays a typing indicator to the other members, only when the sender is still a member. */
export const relayTyping = async (userId: string, event: TypingEventDto): Promise<void> => {
  if (!(await conversationMemberRepository.findActive(event.conversationId, userId))) return
  const others = (await conversationMemberRepository.findActiveUserIds(event.conversationId)).filter((id) => id !== userId)
  emitToUsers(await withoutRestricted(userId, others), ChatEvent.TYPING, { ...event, userId })
}

/** Tells the user's direct-chat partners that they came online or went offline. */
export const broadcastPresence = async (userId: string, isOnline: boolean): Promise<void> => {
  const mine = await conversationMemberRepository.findConversationIdsForUser(userId)
  const direct = await conversationRepository.findIdsByType(mine, ConversationType.DIRECT)
  const members = await conversationMemberRepository.findActiveForConversations(direct)
  const partners = new Set(members.map((member) => member.user.toString()).filter((id) => id !== userId))
  emitToUsers(await withoutRestricted(userId, [...partners]), ChatEvent.PRESENCE, { userId, isOnline })
}
