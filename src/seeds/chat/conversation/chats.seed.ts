import { DEMO_CHATS } from '../../../constants/seeds/demo-content.constants'
import { conversationRepository } from '../../../repositories/chat/conversation/conversation.repository'
import { startDirect } from '../../../services/chat/conversation/conversation.service'
import { createGroup } from '../../../services/chat/conversation/group.service'
import { sendMessage, setReaction } from '../../../services/chat/message/message.service'
import { logger } from '../../../utilities/logging/logger.utility'
import { actAs } from '../../common/seed-actor'

const sendAll = async (conversationId: string, messages: readonly { author: string; body: string }[]) => {
  let lastId = ''
  for (const message of messages) {
    lastId = (await sendMessage(conversationId, { body: message.body }, await actAs(message.author))).id
  }
  return lastId
}

/** A direct chat, a group with a reaction, and a message request; skipped when any chat exists. */
export const seedChats = async (): Promise<void> => {
  if (await conversationRepository.exists({})) return
  const { direct, group, request } = DEMO_CHATS

  const directChat = await startDirect({ userName: direct.to }, await actAs(direct.from))
  await sendAll(directChat.id, direct.messages)

  const groupChat = await createGroup({ title: group.title, userNames: [...group.members] }, await actAs(group.admin))
  const lastId = await sendAll(groupChat.id, group.messages)
  await setReaction({ conversationId: groupChat.id, messageId: lastId }, group.reaction.emoji, await actAs(group.reaction.author))

  const requestChat = await startDirect({ userName: request.to }, await actAs(request.from))
  await sendMessage(requestChat.id, { body: request.body }, await actAs(request.from))
  logger.info('Seeded demo chats')
}
