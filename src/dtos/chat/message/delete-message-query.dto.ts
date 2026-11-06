import { z } from 'zod'
import { DeleteScope } from '../../../enums/chat/message/delete-scope.enum'

export const deleteMessageQuerySchema = z.object({ scope: z.enum(DeleteScope).default(DeleteScope.ME) })

export type DeleteMessageQueryDto = z.infer<typeof deleteMessageQuerySchema>
