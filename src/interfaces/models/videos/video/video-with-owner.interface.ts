import type { PublicUserSource } from '../../users/user/public-user-source.interface'
import type { Video } from './video.interface'

export type VideoWithOwner = Omit<Video, 'owner'> & { owner: PublicUserSource }
