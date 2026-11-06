import { createServer, type Server as HttpServer } from 'http'
import type { AddressInfo } from 'net'
import { io as connect, type Socket } from 'socket.io-client'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from '../../helpers/test-database.helper'
import { api, app, bearer, registerUser, type TestSession } from '../../helpers/api.helper'
import { attachRealtime } from '../../../src/config/realtime/socket.config'
import { setRealtimeServer } from '../../../src/globals/realtime/realtime.globals'

let httpServer: HttpServer
let url = ''
const sockets: Socket[] = []

const open = (token: string): Promise<Socket> =>
  new Promise((resolve, reject) => {
    const socket = connect(url, { auth: { token }, transports: ['websocket'], forceNew: true })
    sockets.push(socket)
    socket.on('connect', () => resolve(socket))
    socket.on('connect_error', reject)
  })

const nextEvent = <T>(socket: Socket, event: string): Promise<T> =>
  new Promise((resolve) => socket.once(event, (payload: T) => resolve(payload)))

const followEachOther = async (first: TestSession, firstName: string, second: TestSession, secondName: string) => {
  await api().put(`/users/${secondName}/follow`).set(...bearer(first))
  await api().put(`/users/${firstName}/follow`).set(...bearer(second))
}

describe('chat sockets', () => {
  beforeAll(async () => {
    await startTestDatabase()
    httpServer = createServer(app)
    attachRealtime(httpServer)
    await new Promise<void>((resolve) => httpServer.listen(0, resolve))
    url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`
  })
  afterAll(async () => {
    sockets.forEach((socket) => socket.close())
    setRealtimeServer(null)
    await new Promise((resolve) => httpServer.close(resolve))
    await stopTestDatabase()
  })
  beforeEach(clearTestDatabase)

  it('rejects connections without a valid access token', async () => {
    await expect(open('not-a-token')).rejects.toThrow()
  })

  it('delivers new messages and typing to the other member live', async () => {
    const ana = await registerUser('liveana')
    const ben = await registerUser('liveben')
    await followEachOther(ana, 'liveana', ben, 'liveben')
    const chat = (await api().post('/chat/conversations').set(...bearer(ana)).send({ userName: 'liveben' })).body.data
    const [anaSocket, benSocket] = await Promise.all([open(ana.accessToken), open(ben.accessToken)])

    const delivered = nextEvent<{ body: string; conversationId: string }>(benSocket, 'message:new')
    await api().post(`/chat/conversations/${chat.id}/messages`).set(...bearer(ana)).send({ body: 'live!' }).expect(201)
    expect(await delivered).toMatchObject({ body: 'live!', conversationId: chat.id })

    const typing = nextEvent<{ userId: string; isTyping: boolean }>(benSocket, 'typing')
    anaSocket.emit('typing', { conversationId: chat.id, isTyping: true })
    expect(await typing).toEqual({ conversationId: chat.id, isTyping: true, userId: ana.id })
  })
})
