import { PresenceState } from '../../enums/chat/realtime/presence-state.enum'
import { PresenceMode } from '../../enums/users/settings/presence-mode.enum'

/** What others see: offline when not connected or set to invisible, otherwise the chosen status. */
export const toPresenceState = (isConnected: boolean, mode: PresenceMode): PresenceState => {
  if (!isConnected || mode === PresenceMode.INVISIBLE) return PresenceState.OFFLINE
  if (mode === PresenceMode.AWAY) return PresenceState.AWAY
  if (mode === PresenceMode.BUSY) return PresenceState.BUSY
  return PresenceState.ONLINE
}
