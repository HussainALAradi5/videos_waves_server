import mongoose from 'mongoose'
import type { AnyBulkWriteOperation, Document } from 'mongodb'
import { LEGACY_COLLECTIONS, LEGACY_VIDEO_MIME } from '../constants/system/migration/migration.constants'
import { ADMIN_REQUEST_CODE_PREFIX } from '../constants/users/admin-request/admin-request.constants'
import { USER_CODE_PREFIX } from '../constants/users/user/user.constants'
import { COMMENT_CODE_PREFIX } from '../constants/videos/comment/comment.constants'
import { VIDEO_CODE_PREFIX, VIDEO_LIKE_CODE_PREFIX } from '../constants/videos/video/video.constants'
import { MEDIA_CODE_PREFIX } from '../constants/media/media/media.constants'
import { AdminRequestStatus } from '../enums/users/admin-request/admin-request-status.enum'
import { MediaKind } from '../enums/media/media/media-kind.enum'
import { MediaProvider } from '../enums/media/media/media-provider.enum'
import { MediaStatus } from '../enums/media/media/media-status.enum'
import { MediaVisibility } from '../enums/media/media/media-visibility.enum'
import { Role } from '../enums/users/roles/role.enum'
import type { Migration } from '../interfaces/migrations/migration.interface'
import { generateCode } from '../utilities/codes/code-generator.utility'

const collection = (name: string) => mongoose.connection.collection(name)
const audit = (code: string) => ({ code, createdBy: null, updatedBy: null, deletedBy: null })
const uniqueIds = (values: unknown): mongoose.Types.ObjectId[] =>
  Array.isArray(values) ? [...new Set(values.map(String))].map((id) => new mongoose.Types.ObjectId(id)) : []

/** password_digest -> passwordHash, isAdmin -> role, image -> avatarUrl, isActive=false -> soft-deleted. */
const migrateUsers = async (): Promise<void> => {
  const users = collection(LEGACY_COLLECTIONS.USERS)
  for await (const user of users.find({ password_digest: { $exists: true } })) {
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          ...audit(user.code ?? generateCode(USER_CODE_PREFIX)),
          passwordHash: user.password_digest,
          role: user.isAdmin ? Role.ADMIN : Role.USER,
          avatarUrl: user.image ?? null,
          avatar: null,
          gender: null,
          bio: '',
          tokenVersion: 0,
          followersCount: 0,
          followingCount: 0,
          videosCount: 0,
          deletedAt: user.isActive === false ? (user.updatedAt ?? new Date()) : null
        },
        $unset: { password_digest: '', isAdmin: '', isActive: '', image: '' }
      }
    )
  }
}

const insertLegacyVideoMedia = async (video: Document, retiredAt: Date | null) => {
  const result = await collection(LEGACY_COLLECTIONS.MEDIA).insertOne({
    ...audit(generateCode(MEDIA_CODE_PREFIX)),
    kind: MediaKind.VIDEO,
    provider: MediaProvider.EXTERNAL,
    visibility: MediaVisibility.PUBLIC,
    status: MediaStatus.ATTACHED,
    fileId: null,
    filePath: typeof video.videoUrl === 'string' ? video.videoUrl : '',
    originalName: '',
    mimeType: LEGACY_VIDEO_MIME,
    sizeBytes: 0,
    width: null,
    height: null,
    durationSeconds: null,
    owner: video.userId,
    providerDeletedAt: null,
    deletedAt: retiredAt,
    createdAt: video.createdAt ?? new Date(),
    updatedAt: new Date()
  })
  return result.insertedId
}

const toLikeUpserts = (videoId: mongoose.Types.ObjectId, userIds: mongoose.Types.ObjectId[]) =>
  userIds.map<AnyBulkWriteOperation<Document>>((user) => ({
    updateOne: {
      filter: { video: videoId, user },
      update: {
        $setOnInsert: {
          ...audit(generateCode(VIDEO_LIKE_CODE_PREFIX)),
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      upsert: true
    }
  }))

/**
 * Legacy videos kept no stored file reference (strict mode dropped `videoUrl`), so each one gets external
 * media when a URL survived and is retired otherwise. `likedBy` becomes VideoLike rows, and the
 * `comments` id list links comments that the legacy bug saved without a video.
 */
const migrateVideos = async (): Promise<void> => {
  const videos = collection(LEGACY_COLLECTIONS.VIDEOS)
  const likes: AnyBulkWriteOperation<Document>[] = []
  for await (const video of videos.find({ userId: { $exists: true } })) {
    const retiredAt = typeof video.videoUrl === 'string' && video.videoUrl.length > 0 ? null : new Date()
    const mediaId = await insertLegacyVideoMedia(video, retiredAt)
    const likers = uniqueIds(video.likedBy)
    likes.push(...toLikeUpserts(video._id, likers))
    const commentIds = uniqueIds(video.comments)
    if (commentIds.length > 0) {
      await collection(LEGACY_COLLECTIONS.COMMENTS).updateMany(
        { _id: { $in: commentIds }, videoId: { $exists: false } },
        { $set: { videoId: video._id } }
      )
    }
    await videos.updateOne(
      { _id: video._id },
      {
        $set: {
          ...audit(video.code ?? generateCode(VIDEO_CODE_PREFIX)),
          owner: video.userId,
          media: mediaId,
          description: video.description ?? '',
          likesCount: likers.length > 0 ? likers.length : (video.numberOfLikes ?? 0),
          viewsCount: video.numberOfViews ?? 0,
          commentsCount: 0,
          deletedAt: retiredAt
        },
        $unset: { userId: '', numberOfLikes: '', numberOfViews: '', likedBy: '', comments: '', videoUrl: '' }
      }
    )
  }
  if (likes.length > 0) await collection(LEGACY_COLLECTIONS.VIDEO_LIKES).bulkWrite(likes)
}

/** userId -> author, videoId -> video, comment -> content; comments that never reached a video are retired. */
const migrateComments = async (): Promise<void> => {
  const comments = collection(LEGACY_COLLECTIONS.COMMENTS)
  for await (const comment of comments.find({ userId: { $exists: true } })) {
    await comments.updateOne(
      { _id: comment._id },
      {
        $set: {
          ...audit(comment.code ?? generateCode(COMMENT_CODE_PREFIX)),
          author: comment.userId,
          video: comment.videoId ?? null,
          content: comment.comment ?? '',
          parent: null,
          deletedAt: comment.videoId ? null : new Date()
        },
        $unset: { userId: '', videoId: '', comment: '' }
      }
    )
  }
}

const toAdminRequestStatus = (isAccepted: unknown): AdminRequestStatus => {
  if (isAccepted === true) return AdminRequestStatus.ACCEPTED
  if (isAccepted === false) return AdminRequestStatus.REJECTED
  return AdminRequestStatus.PENDING
}

/** The legacy `requests` collection becomes admin requests; isAccepted true/false/unset -> accepted/rejected/pending. */
const migrateAdminRequests = async (): Promise<void> => {
  const legacy = collection(LEGACY_COLLECTIONS.ADMIN_REQUESTS)
  const migrated: Document[] = []
  for await (const request of legacy.find({})) {
    migrated.push({
      ...audit(generateCode(ADMIN_REQUEST_CODE_PREFIX)),
      requester: request.requestedUserId,
      reason: request.reason,
      status: toAdminRequestStatus(request.isAccepted),
      decidedBy: null,
      decidedAt: null,
      decisionNote: null,
      deletedAt: null,
      createdAt: request.dateOfRequest ?? request.createdAt ?? new Date(),
      updatedAt: new Date()
    })
  }
  if (migrated.length === 0) return
  await collection(LEGACY_COLLECTIONS.NEW_ADMIN_REQUESTS).insertMany(migrated)
  await legacy.drop()
}

/** Writes each group's count into `field` of the target collection. */
const writeGroupCounts = async (source: string, match: Document, groupBy: string, target: string, field: string) => {
  const groups = await collection(source)
    .aggregate<{ _id: mongoose.Types.ObjectId; total: number }>([
      { $match: match },
      { $group: { _id: `$${groupBy}`, total: { $sum: 1 } } }
    ])
    .toArray()
  for (const group of groups) {
    await collection(target).updateOne({ _id: group._id }, { $set: { [field]: group.total } })
  }
}

export const legacySchemaMigration: Migration = {
  id: '001-legacy-schema',
  description: 'Convert data from the original app (before the TypeScript refactor) to the current schema',
  up: async () => {
    await migrateUsers()
    await migrateVideos()
    await migrateComments()
    await migrateAdminRequests()
    // Counters are recomputed from the migrated rows rather than trusted from legacy fields.
    const { COMMENTS, VIDEOS, USERS } = LEGACY_COLLECTIONS
    await writeGroupCounts(COMMENTS, { deletedAt: null, video: { $ne: null } }, 'video', VIDEOS, 'commentsCount')
    await writeGroupCounts(VIDEOS, { deletedAt: null }, 'owner', USERS, 'videosCount')
  }
}
