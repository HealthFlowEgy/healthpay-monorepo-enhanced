import { HelpersModule } from '@app/helpers';
import { ServicesModule } from '@app/services';
import { WebsocketModule } from '@app/websocket';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from 'apps/hp-fence/src/auth/auth.module';
import { I18nJsonParser, I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { HpNodejsController } from './hp-nodejs.controller';
import { HpNodejsService } from './hp-nodejs.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      parser: I18nJsonParser,
      parserOptions: {
        path: path.join(__dirname, '../hp-sword/i18n/'),
        watch: true,
      },
    }),
    ServicesModule,
    HelpersModule,
    AuthModule,
    WebsocketModule,
  ],
  controllers: [HpNodejsController],
  providers: [HpNodejsService],
})
export class HpNodejsModule {}
