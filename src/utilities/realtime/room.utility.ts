import { USER_ROOM_PREFIX } from '../../constants/chat/realtime/realtime.constants'

/** Every socket joins its user's room, so events reach all of that user's tabs and devices. */
export const userRoom = (userId: string): string => `${USER_ROOM_PREFIX}${userId}`
