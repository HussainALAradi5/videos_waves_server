/** Socket.IO event names. Server-to-client unless marked otherwise. */
export enum ChatEvent {
  MESSAGE_NEW = 'message:new',
  MESSAGE_UPDATED = 'message:updated',
  MESSAGE_REACTION = 'message:reaction',
  CONVERSATION_UPDATED = 'conversation:updated',
  CONVERSATION_READ = 'conversation:read',
  /** Client-to-server and server-to-client. */
  TYPING = 'typing',
  PRESENCE = 'presence'
}
