import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { api, bearer, registerUser, VALID_PASSWORD } from '../../../helpers/api.helper'
import { caseInsensitiveUserNamesMigration } from '../../../../src/migrations/003-case-insensitive-usernames.migration'
import { UserModel } from '../../../../src/models/users/user/user.model'

const signUp = (userName: string, email: string) =>
  api().post('/auth/register').send({ userName, email, password: VALID_PASSWORD, gender: 'male' })

describe('usernames ignore case', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('refuses a name that differs only by case, and keeps the capitals people chose', async () => {
    await signUp('Lina', 'lina@example.com').expect(201)
    await signUp('lina', 'other@example.com').expect(409)
    await signUp('LINA', 'third@example.com').expect(409)
    expect((await api().get('/users/lina').expect(200)).body.data.userName).toBe('Lina')
  })

  it('signs in and opens profiles whatever the case', async () => {
    const lina = await registerUser('lina')
    const login = await api().post('/auth/login').send({ identifier: 'LiNa', password: VALID_PASSWORD }).expect(200)
    expect(login.body.data.user.userName).toBe('lina')
    expect((await api().get('/users/LINA').expect(200)).body.data.userName).toBe('lina')
    await api().put('/users/LINA/follow').set(...bearer(await registerUser('ben'))).expect(200)
    expect((await api().get('/users/lina').set(...bearer(lina)).expect(200)).body.data.followersCount).toBe(1)
  })

  it('stops the migration, changing nothing, when names already clash by case', async () => {
    await UserModel.collection.dropIndexes()
    await UserModel.collection.insertMany([
      { userName: 'Sam', email: 'sam1@example.com', role: 'user', code: 'USR-T1' },
      { userName: 'sam', email: 'sam2@example.com', role: 'user', code: 'USR-T2' }
    ])
    await expect(caseInsensitiveUserNamesMigration.up()).rejects.toThrow(/Sam \/ sam/)
    await UserModel.deleteMany({ userName: { $in: ['Sam', 'sam'] } })
    await caseInsensitiveUserNamesMigration.up()
    expect((await UserModel.collection.indexes()).some((index) => index.name === 'userName_ci')).toBe(true)
  })
})
