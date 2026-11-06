import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { api, bearer, registerAdmin, registerUser } from '../../../helpers/api.helper'

describe('user roles', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('starts every new account as a user', async () => {
    const ana = await registerUser('ana')
    const me = (await api().get('/users/me').set(...bearer(ana)).expect(200)).body.data
    expect(me.role).toBe('user')
  })

  it('lets an admin promote and demote someone else, and signs them out', async () => {
    const boss = await registerAdmin('boss')
    const ana = await registerUser('ana')
    const promoted = (await api().patch('/users/ana/role').set(...bearer(boss)).send({ role: 'admin' }).expect(200)).body.data
    expect(promoted.role).toBe('admin')
    // The old token no longer works: the new role applies from the next sign-in.
    await api().get('/users/me').set(...bearer(ana)).expect(401)
    expect((await api().get('/users/ana').expect(200)).body.data.role).toBe('admin')
    const demoted = (await api().patch('/users/ana/role').set(...bearer(boss)).send({ role: 'user' }).expect(200)).body.data
    expect(demoted.role).toBe('user')
  })

  it('refuses non-admins, your own account, and unknown roles', async () => {
    const boss = await registerAdmin('boss')
    const ana = await registerUser('ana')
    await api().patch('/users/boss/role').set(...bearer(ana)).send({ role: 'user' }).expect(403)
    const own = await api().patch('/users/boss/role').set(...bearer(boss)).send({ role: 'user' }).expect(400)
    expect(own.body.error.message).toMatch(/your own role/i)
    await api().patch('/users/ana/role').set(...bearer(boss)).send({ role: 'owner' }).expect(400)
    await api().patch('/users/ghost/role').set(...bearer(boss)).send({ role: 'admin' }).expect(404)
  })
})
