import type { MessageKind } from '../../../enums/chat/message/message-kind.enum'
import type { SystemAction } from '../../../enums/chat/message/system-action.enum'
import type { MediaResponseDto } from '../../media/media/media-response.dto'
import type { PublicUserResponseDto } from '../../users/user/public-user-response.dto'

export interface MessageResponseDto {
  id: string
  conversationId: string
  sender: PublicUserResponseDto
  kind: MessageKind
  /** null once unsent, and for attachment-only messages. */
  body: string | null
  /** Freshly signed, short-lived URLs; empty once unsent. */
  attachments: MediaResponseDto[]
  replyTo: { id: string; senderUserName: string; kind: MessageKind; preview: string } | null
  sharedVideo: { id: string; title: string; thumbnailUrl: string | null; ownerUserName: string } | null
  systemAction: SystemAction | null
  systemTarget: PublicUserResponseDto | null
  reactions: { emoji: string; count: number }[]
  myReaction: string | null
  isEdited: boolean
  isUnsent: boolean
  createdAt: string
}
