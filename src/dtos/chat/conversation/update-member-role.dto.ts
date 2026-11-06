import { z } from 'zod'
import { MemberRole } from '../../../enums/chat/conversation/member-role.enum'

export const updateMemberRoleSchema = z.object({ role: z.enum(MemberRole) })

export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleSchema>
