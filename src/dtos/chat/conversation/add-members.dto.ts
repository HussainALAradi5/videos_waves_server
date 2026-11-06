import { z } from 'zod'
import { CONVERSATION_LIMITS } from '../../../constants/chat/conversation/conversation.constants'
import { userNameSchema } from '../../../validations/users/user/user.validation'

export const addMembersSchema = z.object({
  userNames: z.array(userNameSchema).min(1).max(CONVERSATION_LIMITS.GROUP_MAX_MEMBERS - 1)
})

export type AddMembersDto = z.infer<typeof addMembersSchema>
