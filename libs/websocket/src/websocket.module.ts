import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WebsocketService } from './websocket.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [WebsocketService],
  exports: [WebsocketService],
})
export class WebsocketModule {}
