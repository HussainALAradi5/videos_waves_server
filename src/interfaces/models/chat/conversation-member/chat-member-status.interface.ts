import type { PresenceState } from '../../../../enums/chat/realtime/presence-state.enum'
/** What a viewer may see of another member's status. */
export interface ChatMemberStatus {
  hidesReads: boolean
  hidesActivity: boolean
  presence: PresenceState
  statusText: string
}
