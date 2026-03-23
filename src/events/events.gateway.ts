import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribeToPix')
  handleSubscribeToPix(
    @MessageBody() data: { chargeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Client ${client.id} subscribing to Pix charge: ${data.chargeId}`);
    client.join(`pix_${data.chargeId}`);
    return { event: 'subscribed', data: { chargeId: data.chargeId } };
  }

  emitPixPaid(chargeId: string, payload: any) {
    this.server.to(`pix_${chargeId}`).emit('pixPaid', payload);
  }
}
