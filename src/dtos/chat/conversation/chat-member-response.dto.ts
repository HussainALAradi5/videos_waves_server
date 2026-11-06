import type { PresenceState } from '../../../enums/chat/realtime/presence-state.enum'
import type { MemberRole } from '../../../enums/chat/conversation/member-role.enum'
import type { PublicUserResponseDto } from '../../users/user/public-user-response.dto'

export interface ChatMemberResponseDto {
  user: PublicUserResponseDto
  role: MemberRole
  /** When they last read the chat; null when unknown or hidden (a restricted viewer never sees it). */
  lastReadAt: string | null
  /** null when hidden from the viewer (restricted). */
  isOnline: boolean | null
  /** Online, away, busy, or offline; null when hidden from the viewer. */
  presence: PresenceState | null
  /** Their custom status line; null when hidden or not set. */
  statusText: string | null
}
