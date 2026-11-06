import type { PublicUserSource } from '../user/public-user-source.interface'
import type { AdminRequest } from './admin-request.interface'

export type AdminRequestWithRequester = Omit<AdminRequest, 'requester'> & { requester: PublicUserSource }
