export enum MessageKind {
  TEXT = 'text',
  MEDIA = 'media',
  VOICE = 'voice',
  VIDEO_SHARE = 'video_share',
  /** Group notices such as "ana added ben"; written by the server, never by clients. */
  SYSTEM = 'system'
}
