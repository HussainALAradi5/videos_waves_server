import mongoose from 'mongoose'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { runPendingMigrations } from '../../../../src/services/system/migration/migration.service'
import { UserModel } from '../../../../src/models/users/user/user.model'
import { VideoModel } from '../../../../src/models/videos/video/video.model'
import { CommentModel } from '../../../../src/models/videos/comment/comment.model'
import { VideoLikeModel } from '../../../../src/models/videos/video-like/video-like.model'
import { AdminRequestModel } from '../../../../src/models/users/admin-request/admin-request.model'
import { MediaModel } from '../../../../src/models/media/media/media.model'

const raw = (name: string) => mongoose.connection.collection(name)

/** Inserts documents shaped exactly like the original JavaScript app wrote them, into a database without new indexes. */
const insertLegacyData = async () => {
  await mongoose.connection.dropDatabase()
  const alice = new mongoose.Types.ObjectId()
  const bob = new mongoose.Types.ObjectId()
  const linkedComment = new mongoose.Types.ObjectId()
  const orphanComment = new mongoose.Types.ObjectId()
  await raw('users').insertMany([
    { _id: alice, userName: 'alice', email: 'alice@example.com', password_digest: 'hash-a', isAdmin: true, isActive: true, image: 'https://cdn.example.com/a.png' },
    { _id: bob, userName: 'bob', email: 'bob@example.com', password_digest: 'hash-b', isAdmin: false, isActive: false }
  ])
  await raw('videos').insertMany([
    { title: 'Playable', userId: alice, videoUrl: 'https://cdn.example.com/v.mp4', numberOfLikes: 7, numberOfViews: 3, likedBy: [bob, bob], comments: [linkedComment] },
    { title: 'Lost file', userId: bob, numberOfLikes: 0, numberOfViews: 0, likedBy: [], comments: [] }
  ])
  // The legacy bug saved `id` instead of `videoId`, so comments only reach a video through its `comments` list.
  await raw('comments').insertMany([
    { _id: linkedComment, userId: bob, comment: 'Nice wave' },
    { _id: orphanComment, userId: alice, comment: 'Lost comment' }
  ])
  await raw('requests').insertMany([
    { requestedUserId: bob, reason: 'I would like to help moderate.', isAccepted: false },
    { requestedUserId: bob, reason: 'Please let me moderate again.' }
  ])
  return { alice, bob }
}

describe('migration service', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('converts legacy users, videos, likes, comments, and admin requests', async () => {
    const { alice, bob } = await insertLegacyData()
    expect(await runPendingMigrations()).toEqual(['001-legacy-schema', '002-sync-indexes', '003-case-insensitive-usernames'])

    const admin = await UserModel.findById(alice).select('+passwordHash').lean()
    expect(admin).toMatchObject({ role: 'admin', passwordHash: 'hash-a', avatarUrl: 'https://cdn.example.com/a.png', deletedAt: null, videosCount: 1 })
    expect(admin?.code).toMatch(/^USR-/)
    expect(admin).not.toHaveProperty('password_digest')
    expect((await UserModel.findById(bob).lean())?.deletedAt).toBeInstanceOf(Date)

    const playable = await VideoModel.findOne({ title: 'Playable' }).lean()
    expect(playable).toMatchObject({ owner: alice, likesCount: 1, viewsCount: 3, commentsCount: 1, deletedAt: null })
    expect((await MediaModel.findById(playable?.media).lean())?.filePath).toBe('https://cdn.example.com/v.mp4')
    expect(await VideoLikeModel.countDocuments({ video: playable?._id })).toBe(1)
    expect((await VideoModel.findOne({ title: 'Lost file' }).lean())?.deletedAt).toBeInstanceOf(Date)

    const linked = await CommentModel.findOne({ content: 'Nice wave' }).lean()
    expect(linked).toMatchObject({ video: playable?._id, author: bob, deletedAt: null })
    expect((await CommentModel.findOne({ content: 'Lost comment' }).lean())?.deletedAt).toBeInstanceOf(Date)

    const requests = await AdminRequestModel.find({ requester: bob }).sort({ status: 1 }).lean()
    expect(requests.map((request) => request.status)).toEqual(['pending', 'rejected'])
    expect(await mongoose.connection.db?.listCollections({ name: 'requests' }).toArray()).toHaveLength(0)
  })

  it('runs each migration only once', async () => {
    await runPendingMigrations()
    expect(await runPendingMigrations()).toEqual([])
  })
})
