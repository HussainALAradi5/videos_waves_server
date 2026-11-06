import mongoose from 'mongoose'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../helpers/test-database.helper'
import { api, bearer, registerUser, uploadMedia, type TestSession } from '../../helpers/api.helper'
import { MessageModel } from '../../../src/models/chat/message/message.model'

const startChat = async (from: TestSession, userName: string) =>
  (await api().post('/chat/conversations').set(...bearer(from)).send({ userName }).expect(200)).body.data

const send = (from: TestSession, conversationId: string, body: object) =>
  api().post(`/chat/conversations/${conversationId}/messages`).set(...bearer(from)).send(body)

const inbox = async (session: TestSession, folder = 'inbox') =>
  (await api().get(`/chat/conversations?folder=${folder}`).set(...bearer(session)).expect(200)).body.data

describe('chat endpoints', () => {
  beforeAll(startTestDatabase)
  afterAll(stopTestDatabase)
  beforeEach(clearTestDatabase)

  it('keeps one direct chat per pair and routes strangers to requests', async () => {
    const ana = await registerUser('ana')
    const ben = await registerUser('ben')
    const chat = await startChat(ana, 'ben')
    expect((await startChat(ana, 'ben')).id).toBe(chat.id)
    // Hidden for Ben until the first message arrives.
    expect(await inbox(ben, 'requests')).toHaveLength(0)

    await send(ana, chat.id, { body: 'Hi Ben!' }).expect(201)
    const requests = await inbox(ben, 'requests')
    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({ me: { status: 'request', unreadCount: 1 }, lastMessage: { preview: 'Hi Ben!' } })
    await send(ben, chat.id, { body: 'Who is this?' }).expect(403)

    await api().post(`/chat/conversations/${chat.id}/accept`).set(...bearer(ben)).expect(200)
    await send(ben, chat.id, { body: 'Hey Ana' }).expect(201)
    expect(await inbox(ben)).toHaveLength(1)
    expect((await api().get('/chat/unread-count').set(...bearer(ana))).body.data.unreadCount).toBe(1)
  })

  it('puts chats from people you follow straight into the inbox', async () => {
    const ana = await registerUser('ana2')
    const ben = await registerUser('ben2')
    await api().put('/users/ana2/follow').set(...bearer(ben))
    const chat = await startChat(ana, 'ben2')
    await send(ana, chat.id, { body: 'hello' }).expect(201)
    expect((await inbox(ben))[0].me.status).toBe('accepted')
  })

  it('refuses outsiders and blocked people', async () => {
    const ana = await registerUser('ana3')
    await registerUser('ben3')
    const eve = await registerUser('eve3')
    const chat = await startChat(ana, 'ben3')
    await api().get(`/chat/conversations/${chat.id}/messages`).set(...bearer(eve)).expect(403)
    await send(eve, chat.id, { body: 'intruder' }).expect(403)
    await api().put('/users/ben3/block').set(...bearer(ana))
    await send(ana, chat.id, { body: 'still there?' }).expect(403)
    await api().post('/chat/conversations').set(...bearer(eve)).send({ userName: 'eve3' }).expect(400)
  })

  it('edits within the window, unsends for everyone, and deletes for me', async () => {
    const ana = await registerUser('ana4')
    const ben = await registerUser('ben4')
    const chat = await startChat(ana, 'ben4')
    const first = (await send(ana, chat.id, { body: 'tpyo' })).body.data
    const base = `/chat/conversations/${chat.id}/messages`
    await api().patch(`${base}/${first.id}`).set(...bearer(ben)).send({ body: 'hack' }).expect(403)
    const edited = await api().patch(`${base}/${first.id}`).set(...bearer(ana)).send({ body: 'typo' }).expect(200)
    expect(edited.body.data).toMatchObject({ body: 'typo', isEdited: true })

    // createdAt is immutable through Mongoose, so age the message directly in the collection.
    await MessageModel.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(first.id as string) },
      { $set: { createdAt: new Date(Date.now() - 60 * 60 * 1000) } }
    )
    await api().patch(`${base}/${first.id}`).set(...bearer(ana)).send({ body: 'late' }).expect(409)

    const second = (await send(ana, chat.id, { body: 'oops' })).body.data
    await api().delete(`${base}/${second.id}?scope=everyone`).set(...bearer(ben)).expect(403)
    await api().delete(`${base}/${second.id}?scope=everyone`).set(...bearer(ana)).expect(200)
    await api().delete(`${base}/${first.id}?scope=me`).set(...bearer(ben)).expect(200)

    const benView = (await api().get(base).set(...bearer(ben))).body.data
    expect(benView).toHaveLength(1)
    expect(benView[0]).toMatchObject({ isUnsent: true, body: null })
    expect((await inbox(ana))[0].lastMessage.preview).toBe('Unsent a message')
  })

  it('pages older messages with a cursor', async () => {
    const ana = await registerUser('ana5')
    await registerUser('ben5')
    const chat = await startChat(ana, 'ben5')
    for (const body of ['one', 'two', 'three']) await send(ana, chat.id, { body })
    const base = `/chat/conversations/${chat.id}/messages`
    const first = (await api().get(`${base}?pageSize=2`).set(...bearer(ana))).body
    expect(first.data.map((message: { body: string }) => message.body)).toEqual(['three', 'two'])
    expect(first.meta.hasMore).toBe(true)
    const second = (await api().get(`${base}?pageSize=2&before=${first.meta.nextCursor}`).set(...bearer(ana))).body
    expect(second.data.map((message: { body: string }) => message.body)).toEqual(['one'])
    expect(second.meta).toMatchObject({ hasMore: false, nextCursor: null })
  })

  it('sends private attachments, voice notes, replies, and reactions', async () => {
    const ana = await registerUser('ana6')
    const ben = await registerUser('ben6')
    await api().put('/users/ana6/follow').set(...bearer(ben))
    const chat = await startChat(ana, 'ben6')
    const photo = await uploadMedia(ana, { kind: 'chat_attachment', fileName: 'p.png', contentType: 'image/png' })
    const withPhoto = (await send(ana, chat.id, { attachmentIds: [photo.id], body: 'look' }).expect(201)).body.data
    expect(withPhoto).toMatchObject({ kind: 'media', attachments: [{ id: photo.id }] })
    expect(withPhoto.attachments[0].url).toContain('signature=')

    const voice = await uploadMedia(ana, { kind: 'voice_note', fileName: 'v.webm', contentType: 'audio/webm' })
    await send(ana, chat.id, { voiceNoteId: voice.id, body: 'no' }).expect(400)
    expect((await send(ana, chat.id, { voiceNoteId: voice.id }).expect(201)).body.data.kind).toBe('voice')

    const reply = (await send(ben, chat.id, { body: 'nice', replyToId: withPhoto.id }).expect(201)).body.data
    expect(reply.replyTo).toMatchObject({ id: withPhoto.id, senderUserName: 'ana6', preview: 'look' })

    const reactionPath = `/chat/conversations/${chat.id}/messages/${withPhoto.id}/reaction`
    await api().put(reactionPath).set(...bearer(ben)).send({ emoji: '🍕' }).expect(400)
    await api().put(reactionPath).set(...bearer(ben)).send({ emoji: '❤️' }).expect(200)
    const replaced = await api().put(reactionPath).set(...bearer(ben)).send({ emoji: '🔥' }).expect(200)
    expect(replaced.body.data.reactions).toEqual([{ emoji: '🔥', count: 1 }])
  })

  it('runs groups with admins, notices, and the last-admin rule', async () => {
    const ana = await registerUser('ana7')
    const ben = await registerUser('ben7')
    const cat = await registerUser('cat7')
    await registerUser('dan7')
    await api().post('/chat/groups').set(...bearer(ana)).send({ title: 'Trip', userNames: ['ben7'] }).expect(400)
    const group = (await api().post('/chat/groups').set(...bearer(ana)).send({ title: 'Trip', userNames: ['ben7', 'cat7'] }).expect(201)).body.data
    expect(group).toMatchObject({ type: 'group', title: 'Trip', membersCount: 3, me: { role: 'admin' } })

    const base = `/chat/conversations/${group.id}`
    await api().post(`${base}/members`).set(...bearer(ben)).send({ userNames: ['dan7'] }).expect(403)
    await api().post(`${base}/members`).set(...bearer(ana)).send({ userNames: ['dan7'] }).expect(200)
    await api().patch(`${base}/members/${ana.id}`).set(...bearer(ana)).send({ role: 'member' }).expect(409)
    await api().patch(base).set(...bearer(cat)).send({ title: 'Mine' }).expect(403)

    // The only admin leaves: the longest-standing member takes over.
    await api().delete(`${base}/members/${ana.id}`).set(...bearer(ana)).expect(200)
    expect((await api().get(base).set(...bearer(ben))).body.data.me.role).toBe('admin')
    await send(ana, group.id, { body: 'I left' }).expect(403)

    await api().post(`${base}/accept`).set(...bearer(ben))
    const notices = (await api().get(`${base}/messages`).set(...bearer(ben))).body.data
    expect(notices.map((message: { systemAction: string }) => message.systemAction)).toEqual([
      'admin_granted',
      'member_left',
      'member_added',
      'group_created'
    ])
  })

  it('hides read receipts from people the reader restricted', async () => {
    const ana = await registerUser('ana8')
    const ben = await registerUser('ben8')
    await api().put('/users/ana8/follow').set(...bearer(ben))
    const chat = await startChat(ana, 'ben8')
    await send(ana, chat.id, { body: 'did you see this?' })
    await api().post(`/chat/conversations/${chat.id}/read`).set(...bearer(ben)).expect(200)
    const seen = (await api().get(`/chat/conversations/${chat.id}`).set(...bearer(ana))).body.data
    expect(seen.members[0].lastReadAt).not.toBeNull()

    await api().put('/users/ana8/restrict').set(...bearer(ben)).expect(200)
    const hidden = (await api().get(`/chat/conversations/${chat.id}`).set(...bearer(ana))).body.data
    expect(hidden.members[0]).toMatchObject({ lastReadAt: null, isOnline: null })
    expect((await api().get(`/chat/conversations/${chat.id}`).set(...bearer(ben))).body.data.me.status).toBe('request')
  })
})
