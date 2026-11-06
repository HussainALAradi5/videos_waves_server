import type { HydratedDocument } from 'mongoose'
import type { Media } from '../../media/media/media.interface'
import type { PublicUserSource } from '../../users/user/public-user-source.interface'
import type { VideoWithOwner } from '../../videos/video/video-with-owner.interface'
import type { ReactionSummary } from '../message-reaction/reaction-summary.interface'
import type { Message } from './message.interface'

/** Everything a page of messages refers to, loaded in batches and looked up by id. */
export interface MessageRelations {
  users: Map<string, PublicUserSource>
  media: Map<string, Media>
  replies: Map<string, HydratedDocument<Message>>
  videos: Map<string, VideoWithOwner>
  reactions: Map<string, ReactionSummary>
}
