import type { Follow } from '../../../interfaces/models/users/follow/follow.interface'
import { FollowModel } from '../../../models/users/follow/follow.model'
import { PairRelationRepository } from '../../base/pair-relation.repository'

class FollowRepository extends PairRelationRepository<Follow> {
  constructor() {
    super(FollowModel, 'follower', 'following')
  }
}

export const followRepository = new FollowRepository()
