import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../../helpers/test-database.helper'
import { api, bearer, registerAdmin, registerUser, type TestSession } from '../../../helpers/api.helper'

const REASON = 'I would like to help moderate comments.'

const createRequest = async (session: TestSession) =>
  (await api().post('/admin-requests').set(...bearer(session)).send({ reason: REASON }).expect(201)).body.data

describe('admin request endpoints', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('allows one pending request per user', async () => {
    const user = await registerUser('hopeful')
    const request = await createRequest(user)
    expect(request).toMatchObject({ status: 'pending', reason: REASON })
    await api().post('/admin-requests').set(...bearer(user)).send({ reason: REASON }).expect(409)
  })

  it('scopes the list: users see their own, admins see all', async () => {
    const first = await registerUser('first')
    const second = await registerUser('second')
    const admin = await registerAdmin('boss')
    await createRequest(first)
    await createRequest(second)

    const own = await api().get('/admin-requests').set(...bearer(first)).expect(200)
    expect(own.body.meta.totalItems).toBe(1)
    const all = await api().get('/admin-requests?status=pending').set(...bearer(admin)).expect(200)
    expect(all.body.meta.totalItems).toBe(2)
  })

  it('blocks other users from reading a request', async () => {
    const owner = await registerUser('owner')
    const snoop = await registerUser('snoop')
    const request = await createRequest(owner)
    await api().get(`/admin-requests/${request.id}`).set(...bearer(snoop)).expect(403)
  })

  it('lets only admins decide, promotes on accept, and blocks a second decision', async () => {
    const user = await registerUser('candidate')
    const admin = await registerAdmin('chief')
    const request = await createRequest(user)
    const decision = `/admin-requests/${request.id}/decision`

    await api().patch(decision).set(...bearer(user)).send({ status: 'accepted' }).expect(403)
    const accepted = await api().patch(decision).set(...bearer(admin)).send({ status: 'accepted', note: 'Welcome' })
    expect(accepted.status).toBe(200)
    expect(accepted.body.data).toMatchObject({ status: 'accepted', decisionNote: 'Welcome', decidedBy: admin.id })

    const profile = await api().get('/users/me').set(...bearer(user)).expect(200)
    expect(profile.body.data.role).toBe('admin')
    await api().patch(decision).set(...bearer(admin)).send({ status: 'rejected' }).expect(409)
  })

  it('lets the requester cancel a pending request and then request again', async () => {
    const user = await registerUser('changed_mind')
    const request = await createRequest(user)
    const cancelled = await api().delete(`/admin-requests/${request.id}`).set(...bearer(user)).expect(200)
    expect(cancelled.body.data.status).toBe('cancelled')
    await api().delete(`/admin-requests/${request.id}`).set(...bearer(user)).expect(409)
    await createRequest(user)
  })

  it('rejects requests from admins and lists users only for admins', async () => {
    const admin = await registerAdmin('already')
    const user = await registerUser('regular')
    await api().post('/admin-requests').set(...bearer(admin)).send({ reason: REASON }).expect(409)
    await api().get('/users').set(...bearer(user)).expect(403)
    const users = await api().get('/users?role=admin').set(...bearer(admin)).expect(200)
    expect(users.body.meta.totalItems).toBe(1)
  })
})
