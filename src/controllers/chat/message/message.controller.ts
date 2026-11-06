import type { Request, Response } from 'express'
import type { CursorRequestDto } from '../../../dtos/common/pagination/cursor-request.dto'
import type { ConversationParamsDto } from '../../../dtos/chat/conversation/conversation-params.dto'
import type { DeleteMessageQueryDto } from '../../../dtos/chat/message/delete-message-query.dto'
import type { EditMessageDto } from '../../../dtos/chat/message/edit-message.dto'
import type { MessageParamsDto } from '../../../dtos/chat/message/message-params.dto'
import type { ReactionDto } from '../../../dtos/chat/message/reaction.dto'
import type { SendMessageDto } from '../../../dtos/chat/message/send-message.dto'
import * as messageService from '../../../services/chat/message/message.service'
import { sendCreated, sendCursorPage, sendSuccess } from '../../../utilities/responses/response.utility'
import { getBody, getParams, getQuery, requireUser } from '../../../utilities/requests/request.utility'

const conversationIdOf = (req: Request): string => getParams<ConversationParamsDto>(req).conversationId

export const listMessages = async (req: Request, res: Response): Promise<void> => {
  const query = getQuery<CursorRequestDto>(req)
  sendCursorPage(res, await messageService.listMessages(conversationIdOf(req), query, requireUser(req)))
}

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const dto = getBody<SendMessageDto>(req)
  sendCreated(res, await messageService.sendMessage(conversationIdOf(req), dto, requireUser(req)))
}

export const editMessage = async (req: Request, res: Response): Promise<void> => {
  const params = getParams<MessageParamsDto>(req)
  sendSuccess(res, await messageService.editMessage(params, getBody<EditMessageDto>(req), requireUser(req)))
}

export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  const params = getParams<MessageParamsDto>(req)
  await messageService.deleteMessage(params, getQuery<DeleteMessageQueryDto>(req).scope, requireUser(req))
  sendSuccess(res, { messageId: params.messageId })
}

export const setReaction = async (req: Request, res: Response): Promise<void> => {
  const { emoji } = getBody<ReactionDto>(req)
  sendSuccess(res, await messageService.setReaction(getParams<MessageParamsDto>(req), emoji, requireUser(req)))
}

export const removeReaction = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await messageService.setReaction(getParams<MessageParamsDto>(req), null, requireUser(req)))
}
