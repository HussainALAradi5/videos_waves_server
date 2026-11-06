import { DEMO_FOLLOWS } from '../../../constants/seeds/demo-content.constants'
import { followUser } from '../../../services/users/follow/follow.service'
import { actAs } from '../../common/seed-actor'

/** Follows are idempotent, so this is safe to re-run. */
export const seedFollows = async (): Promise<void> => {
  for (const [follower, following] of DEMO_FOLLOWS) {
    await followUser(following, await actAs(follower))
  }
}
