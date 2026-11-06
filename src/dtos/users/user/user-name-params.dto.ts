import { z } from 'zod'
import { userNameSchema } from '../../../validations/users/user/user.validation'

export const userNameParamsSchema = z.object({ userName: userNameSchema })

export type UserNameParamsDto = z.infer<typeof userNameParamsSchema>
