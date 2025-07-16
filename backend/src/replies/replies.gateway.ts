// backend/src/replies/replies.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class RepliesGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    // optional config
  }

  notifyNewReply(secretId: string, reply: any) {
    this.server.emit(`replyCreated:${secretId}`, reply);
  }
}
