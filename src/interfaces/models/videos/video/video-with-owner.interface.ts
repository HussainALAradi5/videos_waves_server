import type { Media } from '../../media/media/media.interface'
import type { PublicUserSource } from '../../users/user/public-user-source.interface'
import type { Video } from './video.interface'

/** A video with its owner and media populated, as every video read returns it. */
export type VideoWithOwner = Omit<Video, 'owner' | 'media'> & { owner: PublicUserSource; media: Media }
