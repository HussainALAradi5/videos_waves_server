import { z } from 'zod'
import { userNameSchema } from '../../../validations/users/user/user.validation'

export const startDirectSchema = z.object({ userName: userNameSchema })

export type StartDirectDto = z.infer<typeof startDirectSchema>
