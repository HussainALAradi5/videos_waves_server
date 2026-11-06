import type { HydratedDocument } from 'mongoose'
import { USER_PUBLIC_FIELDS } from '../../../constants/users/user/user.constants'
import type { MessageResponseDto } from '../../../dtos/chat/message/message-response.dto'
import type { Media } from '../../../interfaces/models/media/media/media.interface'
import type { Message } from '../../../interfaces/models/chat/message/message.interface'
import type { MessageRelations } from '../../../interfaces/models/chat/message/message-relations.interface'
import type { PublicUserSource } from '../../../interfaces/models/users/user/public-user-source.interface'
import type { VideoWithOwner } from '../../../interfaces/models/videos/video/video-with-owner.interface'
import { mediaRepository } from '../../../repositories/media/media/media.repository'
import { messageRepository } from '../../../repositories/chat/message/message.repository'
import { messageReactionRepository } from '../../../repositories/chat/message-reaction/message-reaction.repository'
import { userRepository } from '../../../repositories/users/user/user.repository'
import { videoRepository } from '../../../repositories/videos/video/video.repository'
import { toMessageResponse } from '../../../mappers/chat/message/message.mapper'

const ids = (values: (string | { toString(): string } | null)[]): string[] =>
  [...new Set(values.filter((value) => value !== null).map(String))]

const byId = <T extends { _id: { toString(): string } }>(items: T[]): Map<string, T> =>
  new Map(items.map((item) => [item._id.toString(), item]))

/** Loads everything a page of messages refers to with a fixed number of batched queries (no per-message lookups). */
const loadRelations = async (messages: Message[], viewerId: string): Promise<MessageRelations> => {
  const replies = await messageRepository.findManyByIds(ids(messages.map((message) => message.replyTo)))
  const userIds = ids([
    ...messages.map((message) => message.sender),
    ...messages.map((message) => message.systemTarget),
    ...replies.map((reply) => reply.sender)
  ])
  const [users, media, videos, reactions] = await Promise.all([
    userRepository.findPublicByIds(userIds),
    mediaRepository.findManyByIds(ids(messages.flatMap((message) => message.attachments))),
    videoRepository
      .findManyByIds(ids(messages.map((message) => message.sharedVideo)))
      .populate<{ owner: PublicUserSource; media: Media }>([{ path: 'owner', select: USER_PUBLIC_FIELDS }, { path: 'media' }]),
    messageReactionRepository.summarize(messages.map((message) => message._id), viewerId)
  ])
  return {
    users: byId(users as PublicUserSource[]),
    media: byId(media),
    replies: byId(replies as HydratedDocument<Message>[]),
    videos: byId(videos as unknown as VideoWithOwner[]),
    reactions
  }
}

export const buildMessageViews = async (messages: Message[], viewerId: string): Promise<MessageResponseDto[]> => {
  if (messages.length === 0) return []
  const relations = await loadRelations(messages, viewerId)
  return messages.map((message) => toMessageResponse(message, relations))
}

export const buildMessageView = async (message: Message, viewerId: string): Promise<MessageResponseDto> => {
  const [view] = await buildMessageViews([message], viewerId)
  return view
}
