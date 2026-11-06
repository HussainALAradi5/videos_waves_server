import type { HydratedDocument } from 'mongoose'
import type { MemberStatus } from '../../../../enums/chat/conversation/member-status.enum'
import type { User } from '../../users/user/user.interface'

/** Someone being added to a group, with where the invitation lands for them. */
export interface Invitee {
  user: HydratedDocument<User>
  status: MemberStatus
}
