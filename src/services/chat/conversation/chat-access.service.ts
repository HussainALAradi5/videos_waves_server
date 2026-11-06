import { MESSAGES } from '../../../constants/common/messages.constants'
import { ConversationType } from '../../../enums/chat/conversation/conversation-type.enum'
import { MemberRole } from '../../../enums/chat/conversation/member-role.enum'
import { conversationRepository } from '../../../repositories/chat/conversation/conversation.repository'
import { conversationMemberRepository } from '../../../repositories/chat/conversation-member/conversation-member.repository'
import { MemberStatus } from '../../../enums/chat/conversation/member-status.enum'
import { followRepository } from '../../../repositories/users/follow/follow.repository'
import { restrictionRepository } from '../../../repositories/users/restriction/restriction.repository'
import { badRequest, forbidden, notFound } from '../../../utilities/errors/app-error.utility'

/**
 * Where an invitation lands for `inviteeId`, as on Instagram: in their inbox when they follow the
 * inviter and have not restricted them, otherwise in their message requests.
 */
export const resolveInviteStatus = async (inviterId: string, inviteeId: string): Promise<MemberStatus> => {
  const [follows, restricted] = await Promise.all([
    followRepository.has(inviteeId, inviterId),
    restrictionRepository.has(inviteeId, inviterId)
  ])
  return follows && !restricted ? MemberStatus.ACCEPTED : MemberStatus.REQUEST
}

export const findConversationOrFail = async (conversationId: string) => {
  const conversation = await conversationRepository.findById(conversationId)
  if (!conversation) throw notFound(MESSAGES.CHAT.NOT_FOUND)
  return conversation
}

/**
 * The caller's membership, or 403 for outsiders. With `allowLeft`, people who left may still read
 * the history up to when they left (but never write).
 */
export const findMembershipOrFail = async (conversationId: string, userId: string, allowLeft = false) => {
  const member = allowLeft
    ? await conversationMemberRepository.findAny(conversationId, userId)
    : await conversationMemberRepository.findActive(conversationId, userId)
  if (!member) throw forbidden(MESSAGES.CHAT.NOT_A_MEMBER)
  return member
}

/** Loads a group the caller administers; direct chats and non-admins are refused. */
export const findAdministeredGroupOrFail = async (conversationId: string, userId: string) => {
  const conversation = await findConversationOrFail(conversationId)
  if (conversation.type !== ConversationType.GROUP) throw badRequest(MESSAGES.CHAT.GROUP_ONLY)
  const member = await findMembershipOrFail(conversationId, userId)
  if (member.role !== MemberRole.ADMIN) throw forbidden(MESSAGES.CHAT.ADMIN_REQUIRED)
  return { conversation, member }
}
