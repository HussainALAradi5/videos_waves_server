import type { Restriction } from '../../../interfaces/models/users/restriction/restriction.interface'
import { RestrictionModel } from '../../../models/users/restriction/restriction.model'
import { PairRelationRepository } from '../../base/pair-relation.repository'

class RestrictionRepository extends PairRelationRepository<Restriction> {
  constructor() {
    super(RestrictionModel, 'restricter', 'restricted')
  }
}

export const restrictionRepository = new RestrictionRepository()
