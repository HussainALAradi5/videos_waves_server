import type { FollowRequest } from '../../../interfaces/models/users/follow-request/follow-request.interface'
import { FollowRequestModel } from '../../../models/users/follow-request/follow-request.model'
import { PairRelationRepository } from '../../base/pair-relation.repository'

class FollowRequestRepository extends PairRelationRepository<FollowRequest> {
  constructor() {
    super(FollowRequestModel, 'requester', 'target')
  }
}

export const followRequestRepository = new FollowRequestRepository()
