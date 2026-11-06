import { MESSAGE_LIMITS, MESSAGE_PREVIEWS } from '../../constants/chat/message/message.constants'
import { MessageKind } from '../../enums/chat/message/message-kind.enum'

export interface PreviewSource {
  kind: MessageKind
  body: string | null
  attachmentsCount: number
  isUnsent: boolean
}

const truncate = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

/** One-line inbox and reply preview: the text when there is any, otherwise what was sent. */
export const buildMessagePreview = (source: PreviewSource): string => {
  if (source.isUnsent) return MESSAGE_PREVIEWS.UNSENT
  if (source.body) return truncate(source.body.replace(/\s+/g, ' ').trim(), MESSAGE_LIMITS.PREVIEW_MAX)
  switch (source.kind) {
    case MessageKind.VOICE:
      return MESSAGE_PREVIEWS.VOICE
    case MessageKind.VIDEO_SHARE:
      return MESSAGE_PREVIEWS.VIDEO_SHARE
    case MessageKind.SYSTEM:
      return MESSAGE_PREVIEWS.SYSTEM
    default:
      return source.attachmentsCount > 1 ? MESSAGE_PREVIEWS.ATTACHMENTS : MESSAGE_PREVIEWS.ATTACHMENT
  }
}
