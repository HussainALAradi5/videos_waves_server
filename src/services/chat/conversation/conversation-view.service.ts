import type { ConversationResponseDto } from '../../../dtos/chat/conversation/conversation-response.dto'
import type { ConversationMember } from '../../../interfaces/models/chat/conversation-member/conversation-member.interface'
import { conversationRepository } from '../../../repositories/chat/conversation/conversation.repository'
import { conversationMemberRepository } from '../../../repositories/chat/conversation-member/conversation-member.repository'
import { restrictionRepository } from '../../../repositories/users/restriction/restriction.repository'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { toChatMember, toConversationResponse } from '../../../mappers/chat/conversation/conversation.mapper'
import { isOnline } from '../realtime/presence.service'
import { groupBy } from '../../../utilities/collections/group-by.utility'

/**
 * Builds responses for a set of the viewer's memberships with a fixed number of queries
 * (conversations, members, users, restrictions), however many chats are on the page.
 */
export const buildConversationViews = async (
  memberships: ConversationMember[],
  viewerId: string
): Promise<ConversationResponseDto[]> => {
  if (memberships.length === 0) return []
  const conversationIds = memberships.map((member) => member.conversation.toString())
  const [conversations, members] = await Promise.all([
    conversationRepository.findMany(conversationIds),
    conversationMemberRepository.findActiveForConversations(conversationIds)
  ])
  const others = members.filter((member) => member.user.toString() !== viewerId)
  const otherIds = [...new Set(others.map((member) => member.user.toString()))]
  const [users, restrictingViewer] = await Promise.all([
    userRepository.findPublicByIds(otherIds),
    restrictionRepository.findSourceIds(viewerId, otherIds)
  ])
  const usersById = new Map(users.map((user) => [user._id.toString(), user]))
  const conversationsById = new Map(conversations.map((conversation) => [conversation._id.toString(), conversation]))
  const othersByConversation = groupBy(others, (member) => member.conversation.toString())

  return memberships.flatMap((me) => {
    const conversation = conversationsById.get(me.conversation.toString())
    if (!conversation) return []
    const chatMembers = (othersByConversation.get(conversation._id.toString()) ?? []).flatMap((member) => {
      const userId = member.user.toString()
      const user = usersById.get(userId)
      return user ? [toChatMember(member, user, restrictingViewer.has(userId), isOnline(userId))] : []
    })
    return [toConversationResponse(conversation, me, chatMembers)]
  })
}

export const buildConversationView = async (
  membership: ConversationMember,
  viewerId: string
): Promise<ConversationResponseDto> => {
  const [view] = await buildConversationViews([membership], viewerId)
  return view
}
