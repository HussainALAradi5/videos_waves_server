import { Router } from 'express'
import { ROUTES } from '../../../constants/common/routes.constants'
import * as conversationController from '../../../controllers/chat/conversation/conversation.controller'
import * as messageController from '../../../controllers/chat/message/message.controller'
import { cursorRequestSchema } from '../../../dtos/common/pagination/cursor-request.dto'
import { addMembersSchema } from '../../../dtos/chat/conversation/add-members.dto'
import { conversationParamsSchema } from '../../../dtos/chat/conversation/conversation-params.dto'
import { conversationQuerySchema } from '../../../dtos/chat/conversation/conversation-query.dto'
import { createGroupSchema } from '../../../dtos/chat/conversation/create-group.dto'
import { memberParamsSchema } from '../../../dtos/chat/conversation/member-params.dto'
import { startDirectSchema } from '../../../dtos/chat/conversation/start-direct.dto'
import { updateConversationSchema } from '../../../dtos/chat/conversation/update-conversation.dto'
import { updateMemberRoleSchema } from '../../../dtos/chat/conversation/update-member-role.dto'
import { deleteMessageQuerySchema } from '../../../dtos/chat/message/delete-message-query.dto'
import { editMessageSchema } from '../../../dtos/chat/message/edit-message.dto'
import { messageParamsSchema } from '../../../dtos/chat/message/message-params.dto'
import { reactionSchema } from '../../../dtos/chat/message/reaction.dto'
import { sendMessageSchema } from '../../../dtos/chat/message/send-message.dto'
import { authenticate } from '../../../middlewares/auth/authenticate.middleware'
import { validate } from '../../../middlewares/request/validate.middleware'

const C = ROUTES.CHAT
const byConversation = validate({ params: conversationParamsSchema })

/** Every chat route needs a signed-in user; membership is checked in the services. */
export const chatRoutes = Router()

chatRoutes.use(authenticate)
chatRoutes.get(C.UNREAD, conversationController.getUnreadTotal)
chatRoutes.get(C.CONVERSATIONS, validate({ query: conversationQuerySchema }), conversationController.listConversations)
chatRoutes.post(C.CONVERSATIONS, validate({ body: startDirectSchema }), conversationController.startDirect)
chatRoutes.post(C.GROUPS, validate({ body: createGroupSchema }), conversationController.createGroup)
chatRoutes.get(C.CONVERSATION, byConversation, conversationController.getConversation)
chatRoutes.patch(
  C.CONVERSATION,
  validate({ params: conversationParamsSchema, body: updateConversationSchema }),
  conversationController.updateConversation
)
chatRoutes.delete(C.CONVERSATION, byConversation, conversationController.hideConversation)
chatRoutes.post(C.ACCEPT, byConversation, conversationController.acceptRequest)
chatRoutes.post(C.READ, byConversation, conversationController.markRead)
chatRoutes.post(
  C.MEMBERS,
  validate({ params: conversationParamsSchema, body: addMembersSchema }),
  conversationController.addMembers
)
chatRoutes.delete(C.MEMBER, validate({ params: memberParamsSchema }), conversationController.removeMember)
chatRoutes.patch(
  C.MEMBER,
  validate({ params: memberParamsSchema, body: updateMemberRoleSchema }),
  conversationController.setMemberRole
)

chatRoutes.get(
  C.MESSAGES,
  validate({ params: conversationParamsSchema, query: cursorRequestSchema }),
  messageController.listMessages
)
chatRoutes.post(
  C.MESSAGES,
  validate({ params: conversationParamsSchema, body: sendMessageSchema }),
  messageController.sendMessage
)
chatRoutes.patch(C.MESSAGE, validate({ params: messageParamsSchema, body: editMessageSchema }), messageController.editMessage)
chatRoutes.delete(
  C.MESSAGE,
  validate({ params: messageParamsSchema, query: deleteMessageQuerySchema }),
  messageController.deleteMessage
)
chatRoutes.put(C.REACTION, validate({ params: messageParamsSchema, body: reactionSchema }), messageController.setReaction)
chatRoutes.delete(C.REACTION, validate({ params: messageParamsSchema }), messageController.removeReaction)
