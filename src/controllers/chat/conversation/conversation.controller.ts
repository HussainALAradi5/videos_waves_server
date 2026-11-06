import type { Request, Response } from 'express'
import { MESSAGES } from '../../../constants/common/messages.constants'
import type { AddMembersDto } from '../../../dtos/chat/conversation/add-members.dto'
import type { ConversationParamsDto } from '../../../dtos/chat/conversation/conversation-params.dto'
import type { ConversationQueryDto } from '../../../dtos/chat/conversation/conversation-query.dto'
import type { CreateGroupDto } from '../../../dtos/chat/conversation/create-group.dto'
import type { MemberParamsDto } from '../../../dtos/chat/conversation/member-params.dto'
import type { StartDirectDto } from '../../../dtos/chat/conversation/start-direct.dto'
import type { UpdateConversationDto } from '../../../dtos/chat/conversation/update-conversation.dto'
import type { UpdateMemberRoleDto } from '../../../dtos/chat/conversation/update-member-role.dto'
import * as conversationService from '../../../services/chat/conversation/conversation.service'
import * as groupService from '../../../services/chat/conversation/group.service'
import { sendCreated, sendPage, sendSuccess } from '../../../utilities/responses/response.utility'
import { getBody, getParams, getQuery, requireUser } from '../../../utilities/requests/request.utility'

const conversationIdOf = (req: Request): string => getParams<ConversationParamsDto>(req).conversationId

export const listConversations = async (req: Request, res: Response): Promise<void> => {
  sendPage(res, await conversationService.listConversations(getQuery<ConversationQueryDto>(req), requireUser(req)))
}

export const getUnreadTotal = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await conversationService.getUnreadTotal(requireUser(req)))
}

export const startDirect = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await conversationService.startDirect(getBody<StartDirectDto>(req), requireUser(req)))
}

export const createGroup = async (req: Request, res: Response): Promise<void> => {
  sendCreated(res, await groupService.createGroup(getBody<CreateGroupDto>(req), requireUser(req)))
}

export const getConversation = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await conversationService.getConversation(conversationIdOf(req), requireUser(req)))
}

export const updateConversation = async (req: Request, res: Response): Promise<void> => {
  const dto = getBody<UpdateConversationDto>(req)
  sendSuccess(res, await conversationService.updateConversation(conversationIdOf(req), dto, requireUser(req)))
}

export const hideConversation = async (req: Request, res: Response): Promise<void> => {
  await conversationService.hideConversation(conversationIdOf(req), requireUser(req))
  sendSuccess(res, { message: MESSAGES.CHAT.LEFT })
}

export const acceptRequest = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await conversationService.acceptRequest(conversationIdOf(req), requireUser(req)))
}

export const markRead = async (req: Request, res: Response): Promise<void> => {
  await conversationService.markConversationRead(conversationIdOf(req), requireUser(req))
  sendSuccess(res, { conversationId: conversationIdOf(req) })
}

export const addMembers = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await groupService.addMembers(conversationIdOf(req), getBody<AddMembersDto>(req), requireUser(req)))
}

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  const params = getParams<MemberParamsDto>(req)
  await groupService.removeMember(params.conversationId, params.userId, requireUser(req))
  sendSuccess(res, { conversationId: params.conversationId, userId: params.userId })
}

export const setMemberRole = async (req: Request, res: Response): Promise<void> => {
  const params = getParams<MemberParamsDto>(req)
  const { role } = getBody<UpdateMemberRoleDto>(req)
  sendSuccess(res, await groupService.setMemberRole(params.conversationId, params.userId, role, requireUser(req)))
}
