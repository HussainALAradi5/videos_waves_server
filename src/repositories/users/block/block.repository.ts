import type { Block } from '../../../interfaces/models/users/block/block.interface'
import { BlockModel } from '../../../models/users/block/block.model'
import { PairRelationRepository } from '../../base/pair-relation.repository'

class BlockRepository extends PairRelationRepository<Block> {
  constructor() {
    super(BlockModel, 'blocker', 'blocked')
  }
}

export const blockRepository = new BlockRepository()
