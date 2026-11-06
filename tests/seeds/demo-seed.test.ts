import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from '../../src/config'
import { Role } from '../../src/enums/users/roles/role.enum'
import { MemberStatus } from '../../src/enums/chat/conversation/member-status.enum'
import { ConversationModel } from '../../src/models/chat/conversation/conversation.model'
import { ConversationMemberModel } from '../../src/models/chat/conversation-member/conversation-member.model'
import { UserModel } from '../../src/models/users/user/user.model'
import { CommentModel } from '../../src/models/videos/comment/comment.model'
import { runSeeds } from '../../src/seeds'
import { userRepository } from '../../src/repositories/users/user/user.repository'
import { comparePassword, hashPassword } from '../../src/utilities/security/password.utility'
import { startTestDatabase, stopTestDatabase } from '../helpers/test-database.helper'

// Generated passwords would be written to the working directory.
vi.mock('fs/promises', () => ({ writeFile: vi.fn() }))

const DEMO_PASSWORD = 'DemoWaves2026'

describe('demo seed', () => {
  beforeAll(async () => {
    await startTestDatabase()
    await runSeeds()
  })
  afterAll(stopTestDatabase)

  it('creates two admins and four users with standard-avatar genders', async () => {
    const users = await UserModel.find({}, 'userName role gender').lean()
    expect(users.filter((user) => user.role === Role.ADMIN).map((user) => user.userName).sort()).toEqual(['admin', 'moderator'])
    expect(users.filter((user) => user.role === Role.USER)).toHaveLength(4)
    expect(users.every((user) => user.gender !== null)).toBe(true)
  })

  it('adds follows, owner replies, and chats through the real services', async () => {
    const admin = await UserModel.findOne({ userName: 'admin' }).lean()
    expect(admin?.followersCount).toBe(5)
    expect(await CommentModel.countDocuments({ parent: null })).toBe(3)
    expect(await CommentModel.countDocuments({ parent: { $ne: null } })).toBe(3)
    expect(await ConversationModel.countDocuments()).toBe(3)

    const maya = await UserModel.findOne({ userName: 'maya' }).lean()
    const requests = await ConversationMemberModel.countDocuments({ user: maya?._id, status: MemberStatus.REQUEST })
    expect(requests).toBe(1)
  })

  it('is safe to run again', async () => {
    await runSeeds()
    expect(await UserModel.countDocuments()).toBe(6)
    expect(await CommentModel.countDocuments()).toBe(6)
    expect(await ConversationModel.countDocuments()).toBe(3)
  })

  it('brings back a demo account a visitor deactivated or whose password they changed', async () => {
    env.SEED_USER_PASSWORD = DEMO_PASSWORD
    try {
      const viewer = await UserModel.findOne({ userName: 'viewer' })
      await UserModel.updateOne({ _id: viewer?._id }, { $set: { passwordHash: await hashPassword('Hijacked123'), deletedAt: new Date() } })

      await runSeeds()

      const restored = await userRepository.findByLogin('viewer')
      expect(restored).not.toBeNull()
      expect(await comparePassword(DEMO_PASSWORD, restored!.passwordHash)).toBe(true)
    } finally {
      env.SEED_USER_PASSWORD = undefined
    }
  })
})
