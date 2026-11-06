import { MuteDuration } from '../../../enums/chat/conversation/mute-duration.enum'
import type { QueryFilter } from 'mongoose'
import { MESSAGES } from '../../../constants/common/messages.constants'
import { ConversationType } from '../../../enums/chat/conversation/conversation-type.enum'
import { InboxFolder } from '../../../enums/chat/conversation/inbox-folder.enum'
import { MemberStatus } from '../../../enums/chat/conversation/member-status.enum'
import { ChatEvent } from '../../../enums/chat/realtime/chat-event.enum'
import type { ConversationQueryDto } from '../../../dtos/chat/conversation/conversation-query.dto'
import type { ConversationResponseDto } from '../../../dtos/chat/conversation/conversation-response.dto'
import type { StartDirectDto } from '../../../dtos/chat/conversation/start-direct.dto'
import type { UpdateConversationDto } from '../../../dtos/chat/conversation/update-conversation.dto'
import type { AuthUser } from '../../../interfaces/users/auth/auth-user.interface'
import type { PageResult } from '../../../interfaces/common/pagination/page-result.interface'
import type { ConversationMember } from '../../../interfaces/models/chat/conversation-member/conversation-member.interface'
import { conversationRepository } from '../../../repositories/chat/conversation/conversation.repository'
import { conversationMemberRepository } from '../../../repositories/chat/conversation-member/conversation-member.repository'
import { restrictionRepository } from '../../../repositories/users/restriction/restriction.repository'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { SystemAction } from '../../../enums/chat/message/system-action.enum'
import { withTransaction } from '../../../utilities/database/transaction.utility'
import { badRequest, conflict, forbidden, notFound } from '../../../utilities/errors/app-error.utility'
import { escapeRegex } from '../../../utilities/strings/escape-regex.utility'
import { toObjectId } from '../../../utilities/ids/object-id.utility'
import { buildDirectKey } from '../../../utilities/chat/conversation.utility'
import { MUTE_DURATION_MS, MUTED_FOREVER } from '../../../constants/chat/conversation/conversation.constants'
import { intersectAll } from '../../../utilities/collections/intersect.utility'
import { isBlockedEitherWay } from '../../users/visibility/visibility.service'
import { acceptsMessagesFrom, findUsersHiding } from '../../users/settings/settings.service'
import { emitToUsers } from '../realtime/chat-events.service'
import { broadcastConversationChange, broadcastMessages, postSystemMessage } from '../message/message-posting.service'
import {
  findAdministeredGroupOrFail,
  findConversationOrFail,
  findMembershipOrFail,
  resolveInviteStatus
} from './chat-access.service'
import { buildConversationView, buildConversationViews } from './conversation-view.service'

/** Inbox search: groups whose title matches, or chats with someone whose username matches. */
const findSearchMatches = async (userId: string, search: string): Promise<string[]> => {
  const pattern = new RegExp(escapeRegex(search), 'i')
  const mine = await conversationMemberRepository.findConversationIdsForUser(userId)
  const people = await userRepository.findIdsByUserName(pattern)
  const [byTitle, byPeople] = await Promise.all([
    conversationRepository.findGroupIdsByTitle(mine, pattern),
    conversationMemberRepository.findConversationIdsWithUsers(mine, people.filter((id) => id !== userId))
  ])
  return [...new Set([...byTitle, ...byPeople])]
}

const buildFolderFilter = async (query: ConversationQueryDto, userId: string): Promise<QueryFilter<ConversationMember>> => {
  const filter: QueryFilter<ConversationMember> = {
    status: query.folder === InboxFolder.REQUESTS ? MemberStatus.REQUEST : MemberStatus.ACCEPTED
  }
  if (query.folder === InboxFolder.UNREAD) filter.unreadCount = { $gt: 0 }
  if (query.folder === InboxFolder.READ) filter.unreadCount = 0
  const scopes: string[][] = []
  if (query.folder === InboxFolder.GROUPS) {
    const mine = await conversationMemberRepository.findConversationIdsForUser(userId)
    scopes.push(await conversationRepository.findIdsByType(mine, ConversationType.GROUP))
  }
  if (query.search) scopes.push(await findSearchMatches(userId, query.search))
  if (scopes.length > 0) filter.conversation = { $in: intersectAll(scopes).map(toObjectId) }
  return conversationMemberRepository.inboxFilter(userId, filter)
}

/** The viewer's inbox, requests, groups, unread, or read chats, most recent first. */
export const listConversations = async (
  query: ConversationQueryDto,
  actor: AuthUser
): Promise<PageResult<ConversationResponseDto>> => {
  const page = await conversationMemberRepository.paginate<ConversationMember>(await buildFolderFilter(query, actor.id), query)
  return { items: await buildConversationViews(page.items, actor.id), meta: page.meta }
}

export const getConversation = async (conversationId: string, actor: AuthUser): Promise<ConversationResponseDto> =>
  buildConversationView(await findMembershipOrFail(conversationId, actor.id, true), actor.id)

export const getUnreadTotal = async (actor: AuthUser): Promise<{ unreadCount: number }> => ({
  unreadCount: await conversationMemberRepository.totalUnread(actor.id)
})

/**
 * Opens the one direct chat with a person, creating it on first use. It lands in their requests
 * unless they follow you and have not restricted you, and stays hidden for them until you send
 * the first message.
 */
export const startDirect = async (dto: StartDirectDto, actor: AuthUser): Promise<ConversationResponseDto> => {
  const target = await userRepository.findByUserName(dto.userName)
  if (!target || target.deactivatedAt) throw notFound(MESSAGES.USERS.NOT_FOUND)
  const targetId = target._id.toString()
  if (targetId === actor.id) throw badRequest(MESSAGES.CHAT.CANNOT_MESSAGE_SELF)
  if (await isBlockedEitherWay(actor.id, targetId)) throw forbidden(MESSAGES.CHAT.CANNOT_MESSAGE_USER)
  const directKey = buildDirectKey(actor.id, targetId)
  const existing = await conversationRepository.findByDirectKey(directKey)
  if (existing) {
    const mine = await findMembershipOrFail(existing._id.toString(), actor.id)
    await conversationMemberRepository.updateById(mine._id.toString(), { $set: { hiddenAt: null } }, actor.id)
    return getConversation(existing._id.toString(), actor)
  }
  if (!(await acceptsMessagesFrom(targetId, actor.id))) throw forbidden(MESSAGES.CHAT.MESSAGES_FOLLOWING_ONLY)
  const status = await resolveInviteStatus(actor.id, targetId)
  const conversation = await withTransaction(async () => {
    const created = await conversationRepository.create(
      { type: ConversationType.DIRECT, directKey, membersCount: 2, lastMessageAt: new Date() },
      actor.id
    )
    await conversationMemberRepository.create(
      { conversation: created._id, user: toObjectId(actor.id), lastMessageAt: created.lastMessageAt },
      actor.id
    )
    await conversationMemberRepository.create(
      { conversation: created._id, user: target._id, status, hiddenAt: new Date(), lastMessageAt: created.lastMessageAt },
      actor.id
    )
    return created
  })
  return getConversation(conversation._id.toString(), actor)
}

/** When a mute ends: a timed mute counts from now, `always` never ends, `off` clears it. */
const muteUntil = (mute: MuteDuration): Date | null => {
  if (mute === MuteDuration.OFF) return null
  if (mute === MuteDuration.ALWAYS) return MUTED_FOREVER
  return new Date(Date.now() + MUTE_DURATION_MS[mute])
}

/** Rename (group admins) and mute (any member, for themselves only: 8 hours, a week, or until unmuted). */
export const updateConversation = async (
  conversationId: string,
  dto: UpdateConversationDto,
  actor: AuthUser
): Promise<ConversationResponseDto> => {
  const member = await findMembershipOrFail(conversationId, actor.id)
  const mute = dto.mute ?? (dto.isMuted === undefined ? undefined : dto.isMuted ? MuteDuration.ALWAYS : MuteDuration.OFF)
  if (mute !== undefined) {
    await conversationMemberRepository.updateById(member._id.toString(), { $set: { mutedUntil: muteUntil(mute) } }, actor.id)
  }
  if (dto.background !== undefined) {
    await conversationMemberRepository.updateById(member._id.toString(), { $set: { background: dto.background } }, actor.id)
  }
  if (dto.title !== undefined) {
    await findAdministeredGroupOrFail(conversationId, actor.id)
    const notice = await withTransaction(async () => {
      await conversationRepository.updateById(conversationId, { $set: { title: dto.title } }, actor.id)
      return postSystemMessage(conversationId, actor.id, SystemAction.GROUP_RENAMED)
    })
    await broadcastMessages(conversationId, [notice])
    await broadcastConversationChange(conversationId)
  }
  return getConversation(conversationId, actor)
}

/** Moves a message request into the inbox, so the person can reply. */
export const acceptRequest = async (conversationId: string, actor: AuthUser): Promise<ConversationResponseDto> => {
  const member = await findMembershipOrFail(conversationId, actor.id)
  if (member.status !== MemberStatus.REQUEST) throw conflict(MESSAGES.CHAT.NOT_FOUND)
  await conversationMemberRepository.updateById(member._id.toString(), { $set: { status: MemberStatus.ACCEPTED } }, actor.id)
  await broadcastConversationChange(conversationId)
  return getConversation(conversationId, actor)
}

/** "Delete chat" for me (or decline a request): hidden until someone sends a newer message. */
export const hideConversation = async (conversationId: string, actor: AuthUser): Promise<void> => {
  const member = await findMembershipOrFail(conversationId, actor.id)
  await conversationMemberRepository.updateById(member._id.toString(), { $set: { hiddenAt: new Date(), unreadCount: 0 } }, actor.id)
}

/**
 * Marks the chat read and tells the others ("Seen"), except people the reader restricted: they
 * never learn when their messages were read.
 */
export const markConversationRead = async (conversationId: string, actor: AuthUser): Promise<void> => {
  await findConversationOrFail(conversationId)
  await findMembershipOrFail(conversationId, actor.id)
  const readAt = new Date()
  await conversationMemberRepository.markRead(conversationId, actor.id, readAt)
  emitToUsers([actor.id], ChatEvent.CONVERSATION_UPDATED, { conversationId })
  // With read receipts off, the chat is marked read for the reader but nobody is told.
  if ((await findUsersHiding([actor.id], 'readReceipts')).size > 0) return
  const others = (await conversationMemberRepository.findActiveUserIds(conversationId)).filter((id) => id !== actor.id)
  const restricted = await restrictionRepository.findTargetIds(actor.id, others)
  emitToUsers(others.filter((id) => !restricted.has(id)), ChatEvent.CONVERSATION_READ, {
    conversationId,
    userId: actor.id,
    lastReadAt: readAt.toISOString()
  })
}

