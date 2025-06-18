import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Secret } from './secret.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class SecretsGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    // optional: configure server
  }

  notifyNewSecret(secret: {
    id: string;
    text: string;
    mood?: string;
    status: string;
    createdAt: Date;
  }) {
    this.server.emit('secretCreated', secret);
  }
}
