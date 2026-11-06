import type { MessageResponseDto } from '../../../dtos/chat/message/message-response.dto'
import type { Message } from '../../../interfaces/models/chat/message/message.interface'
import type { MessageRelations } from '../../../interfaces/models/chat/message/message-relations.interface'
import { buildMessagePreview } from '../../../utilities/chat/message-preview.utility'
import { toMediaResponse } from '../../media/media/media.mapper'
import { toPublicUser } from '../../users/user/user.mapper'
import { toObjectId } from '../../../utilities/ids/object-id.utility'

/** Shown for people whose account no longer exists. */
const DELETED_USER_NAME = 'deleted'

export const previewOf = (message: Message): string =>
  buildMessagePreview({
    kind: message.kind,
    body: message.body,
    attachmentsCount: message.attachments.length,
    isUnsent: message.unsentAt !== null
  })

const userOrPlaceholder = (relations: MessageRelations, id: string) =>
  toPublicUser(relations.users.get(id) ?? { _id: toObjectId(id), userName: DELETED_USER_NAME, avatarUrl: null })

export const toMessageResponse = (message: Message, relations: MessageRelations): MessageResponseDto => {
  const isUnsent = message.unsentAt !== null
  const reply = message.replyTo ? relations.replies.get(message.replyTo.toString()) : undefined
  const video = message.sharedVideo && !isUnsent ? relations.videos.get(message.sharedVideo.toString()) : undefined
  const reactions = relations.reactions.get(message._id.toString())
  return {
    id: message._id.toString(),
    conversationId: message.conversation.toString(),
    sender: userOrPlaceholder(relations, message.sender.toString()),
    kind: message.kind,
    body: isUnsent ? null : message.body,
    attachments: isUnsent
      ? []
      : message.attachments.flatMap((id) => {
          const media = relations.media.get(id.toString())
          return media ? [toMediaResponse(media)] : []
        }),
    replyTo: reply
      ? {
          id: reply._id.toString(),
          senderUserName: userOrPlaceholder(relations, reply.sender.toString()).userName,
          kind: reply.kind,
          preview: previewOf(reply)
        }
      : null,
    sharedVideo: video
      ? {
          id: video._id.toString(),
          title: video.title,
          thumbnailUrl: toMediaResponse(video.media).thumbnailUrl,
          ownerUserName: video.owner.userName
        }
      : null,
    systemAction: message.systemAction,
    systemTarget: message.systemTarget ? userOrPlaceholder(relations, message.systemTarget.toString()) : null,
    reactions: reactions ? [...reactions.counts].map(([emoji, count]) => ({ emoji, count })) : [],
    myReaction: reactions?.mine ?? null,
    isEdited: message.editedAt !== null,
    isUnsent,
    createdAt: message.createdAt.toISOString()
  }
}
