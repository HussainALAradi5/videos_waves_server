import type { PublicUserSource } from '../../users/user/public-user-source.interface'
import type { Comment } from './comment.interface'

export type CommentWithAuthor = Omit<Comment, 'author'> & { author: PublicUserSource }
