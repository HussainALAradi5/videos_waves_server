import { MESSAGES } from '../../../constants/common/messages.constants'
import { CONVERSATION_LIMITS } from '../../../constants/chat/conversation/conversation.constants'
import { ConversationType } from '../../../enums/chat/conversation/conversation-type.enum'
import { MemberRole } from '../../../enums/chat/conversation/member-role.enum'
import { MemberStatus } from '../../../enums/chat/conversation/member-status.enum'
import { SystemAction } from '../../../enums/chat/message/system-action.enum'
import type { AddMembersDto } from '../../../dtos/chat/conversation/add-members.dto'
import type { ConversationResponseDto } from '../../../dtos/chat/conversation/conversation-response.dto'
import type { CreateGroupDto } from '../../../dtos/chat/conversation/create-group.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { Message } from '../../../interfaces/models/chat/message/message.interface'
import type { Invitee } from '../../../interfaces/models/chat/conversation/invitee.interface'
import { conversationRepository } from '../../../repositories/chat/conversation/conversation.repository'
import { conversationMemberRepository } from '../../../repositories/chat/conversation-member/conversation-member.repository'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { withTransaction } from '../../../utilities/database/transaction.utility'
import { toObjectId } from '../../../utilities/ids/object-id.utility'
import { badRequest, conflict, forbidden, notFound } from '../../../utilities/errors/app-error.utility'
import { isBlockedEitherWay } from '../../users/visibility/visibility.service'
import { broadcastConversationChange, broadcastMessages, postSystemMessage } from '../message/message-posting.service'
import { findAdministeredGroupOrFail, findConversationOrFail, findMembershipOrFail, resolveInviteStatus } from './chat-access.service'
import { getConversation } from './conversation.service'

/**
 * Resolves invitees by name with where each invitation lands. Unknown names are 404, and people
 * blocked either way with the inviter are refused. Reads only, so it runs before the transaction.
 */
const resolveInvitees = async (userNames: string[], actor: AuthUser): Promise<Invitee[]> => {
  const unique = [...new Set(userNames)]
  const users = await userRepository.findByUserNames(unique)
  if (users.length !== unique.length || users.some((user) => user.deactivatedAt)) throw notFound(MESSAGES.USERS.NOT_FOUND)
  const invitees: Invitee[] = []
  for (const user of users.filter((candidate) => candidate._id.toString() !== actor.id)) {
    if (await isBlockedEitherWay(actor.id, user._id.toString())) throw forbidden(MESSAGES.CHAT.CANNOT_MESSAGE_USER)
    invitees.push({ user, status: await resolveInviteStatus(actor.id, user._id.toString()) })
  }
  return invitees
}

/** Adds (or re-adds someone who left) each invitee and updates the member count; inside a transaction. */
const upsertInvitees = async (conversationId: string, invitees: Invitee[], actor: AuthUser): Promise<void> => {
  for (const { user, status } of invitees) {
    const previous = await conversationMemberRepository.findAny(conversationId, user._id.toString())
    const reset = { leftAt: null, hiddenAt: null, role: MemberRole.MEMBER, status, unreadCount: 0 }
    if (previous) await conversationMemberRepository.updateById(previous._id.toString(), { $set: reset }, actor.id)
    else await conversationMemberRepository.create({ conversation: toObjectId(conversationId), user: user._id, ...reset }, actor.id)
  }
  await conversationRepository.incrementCounter(conversationId, 'membersCount', invitees.length)
}

/** The creator becomes the group's admin; invitees who do not follow them get it as a request. */
export const createGroup = async (dto: CreateGroupDto, actor: AuthUser): Promise<ConversationResponseDto> => {
  const invitees = await resolveInvitees(dto.userNames, actor)
  if (invitees.length < CONVERSATION_LIMITS.GROUP_MIN_INVITEES) throw badRequest(MESSAGES.COMMON.VALIDATION_FAILED)
  const { conversationId, notices } = await withTransaction(async () => {
    const conversation = await conversationRepository.create(
      { type: ConversationType.GROUP, title: dto.title, membersCount: 1, lastMessageAt: new Date() },
      actor.id
    )
    const id = conversation._id.toString()
    await conversationMemberRepository.create({ conversation: conversation._id, user: toObjectId(actor.id), role: MemberRole.ADMIN }, actor.id)
    await upsertInvitees(id, invitees, actor)
    // Posted after everyone joined, so every member's history starts with it.
    return { conversationId: id, notices: [await postSystemMessage(id, actor.id, SystemAction.GROUP_CREATED)] }
  })
  await broadcastMessages(conversationId, notices)
  return getConversation(conversationId, actor)
}

export const addMembers = async (conversationId: string, dto: AddMembersDto, actor: AuthUser): Promise<ConversationResponseDto> => {
  const { conversation } = await findAdministeredGroupOrFail(conversationId, actor.id)
  const current = new Set(await conversationMemberRepository.findActiveUserIds(conversationId))
  const invitees = (await resolveInvitees(dto.userNames, actor)).filter(({ user }) => !current.has(user._id.toString()))
  if (invitees.length === 0) throw conflict(MESSAGES.CHAT.ALREADY_MEMBER)
  if (conversation.membersCount + invitees.length > CONVERSATION_LIMITS.GROUP_MAX_MEMBERS) throw conflict(MESSAGES.CHAT.GROUP_FULL)
  const notices = await withTransaction(async () => {
    await upsertInvitees(conversationId, invitees, actor)
    const posted: Message[] = []
    for (const { user } of invitees) {
      posted.push(await postSystemMessage(conversationId, actor.id, SystemAction.MEMBER_ADDED, user._id))
    }
    return posted
  })
  await broadcastMessages(conversationId, notices)
  return getConversation(conversationId, actor)
}

/** Ends a membership; when the last admin goes, the longest-standing member is promoted. Inside a transaction. */
const endMembership = async (conversationId: string, userId: string, actor: AuthUser, action: SystemAction) => {
  const member = await findMembershipOrFail(conversationId, userId)
  const isLastAdmin = member.role === MemberRole.ADMIN && (await conversationMemberRepository.countAdmins(conversationId)) === 1
  await conversationMemberRepository.updateById(member._id.toString(), { $set: { leftAt: new Date(), role: MemberRole.MEMBER } }, actor.id)
  await conversationRepository.incrementCounter(conversationId, 'membersCount', -1)
  const notices = [await postSystemMessage(conversationId, actor.id, action, member.user)]
  const heir = isLastAdmin ? await conversationMemberRepository.findOldestMember(conversationId) : null
  if (heir) {
    await conversationMemberRepository.updateById(heir._id.toString(), { $set: { role: MemberRole.ADMIN } }, actor.id)
    notices.push(await postSystemMessage(conversationId, actor.id, SystemAction.ADMIN_GRANTED, heir.user))
  }
  return notices
}

const assertGroup = async (conversationId: string): Promise<void> => {
  const conversation = await findConversationOrFail(conversationId)
  if (conversation.type !== ConversationType.GROUP) throw badRequest(MESSAGES.CHAT.GROUP_ONLY)
}

/** Removing yourself is leaving; removing someone else needs an admin. The removed person keeps the history up to now. */
export const removeMember = async (conversationId: string, userId: string, actor: AuthUser): Promise<void> => {
  const isLeaving = userId === actor.id
  if (isLeaving) await assertGroup(conversationId)
  else await findAdministeredGroupOrFail(conversationId, actor.id)
  const action = isLeaving ? SystemAction.MEMBER_LEFT : SystemAction.MEMBER_REMOVED
  const notices = await withTransaction(() => endMembership(conversationId, userId, actor, action))
  await broadcastMessages(conversationId, notices, [userId])
  await broadcastConversationChange(conversationId, [userId])
}

/** Promote or demote; an admin cannot step down while they are the only one. */
export const setMemberRole = async (
  conversationId: string,
  userId: string,
  role: MemberRole,
  actor: AuthUser
): Promise<ConversationResponseDto> => {
  await findAdministeredGroupOrFail(conversationId, actor.id)
  const member = await findMembershipOrFail(conversationId, userId)
  if (member.status === MemberStatus.REQUEST) throw conflict(MESSAGES.CHAT.REQUEST_PENDING)
  if (member.role === role) return getConversation(conversationId, actor)
  if (role === MemberRole.MEMBER && (await conversationMemberRepository.countAdmins(conversationId)) === 1) {
    throw conflict(MESSAGES.CHAT.LAST_ADMIN)
  }
  const action = role === MemberRole.ADMIN ? SystemAction.ADMIN_GRANTED : SystemAction.ADMIN_REVOKED
  const notice = await withTransaction(async () => {
    await conversationMemberRepository.updateById(member._id.toString(), { $set: { role } }, actor.id)
    return postSystemMessage(conversationId, actor.id, action, member.user)
  })
  await broadcastMessages(conversationId, [notice])
  return getConversation(conversationId, actor)
}
