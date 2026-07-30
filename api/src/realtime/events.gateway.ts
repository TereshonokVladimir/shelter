import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { AuthService } from '../auth/auth.service'

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server

  constructor(private readonly auth: AuthService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers.authorization?.startsWith('Bearer ')
          ? client.handshake.headers.authorization.slice(7)
          : undefined)
      const userId = await this.auth.verify(token)
      client.data.userId = userId
    } catch {
      client.disconnect()
    }
  }

  @SubscribeMessage('room:join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() body: { code: string }) {
    if (!body?.code) return
    const roomName = `room:${body.code.toUpperCase()}`
    void client.join(roomName)
    return { ok: true, room: roomName }
  }

  emitRoomUpdated(code: string) {
    this.server.to(`room:${code.toUpperCase()}`).emit('room:updated', { code })
  }
}
