import { z } from 'zod'
import { CONVERSATION_LIMITS } from '../../../constants/chat/conversation/conversation.constants'
import { userNameSchema } from '../../../validations/users/user/user.validation'
import { groupTitleSchema } from '../../../validations/chat/conversation/conversation.validation'

export const createGroupSchema = z.object({
  title: groupTitleSchema,
  userNames: z
    .array(userNameSchema)
    .min(CONVERSATION_LIMITS.GROUP_MIN_INVITEES)
    .max(CONVERSATION_LIMITS.GROUP_MAX_MEMBERS - 1)
})

export type CreateGroupDto = z.infer<typeof createGroupSchema>
