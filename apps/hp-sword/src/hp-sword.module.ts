import { HelpersModule } from '@app/helpers';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ServicesModule } from '@app/services';
import { WebsocketModule } from '@app/websocket';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import { I18nJsonParser, I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { AuthModule } from './auth/auth.module';
import { SwordMerchantsOnlyGuard } from './guards/sword-merchants-only.guard';
import { SwordMerchantWithTokenResolver } from './sword-merchant-apis/sword-merchant-apis.resolver';
import { SwordMerchantUserApisResolver } from './sword-merchant-user-apis/sword-merchant-user-apis.resolver';
import { SwordUserWalletResolver } from './sword-user-wallet/sword-user-wallet.resolver';
import { SwordControllerController } from './sword-controller/sword-controller.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      introspection: true,
      buildSchemaOptions: { dateScalarMode: 'timestamp' },
      debug: false,
      driver: ApolloDriver,
      playgroud: true,
      // introspection: true,
      context: ({ req, connection, ...rest }) =>
        connection ? { req: connection.context, ...rest } : { req, ...rest },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      parser: I18nJsonParser,
      parserOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
    }),
    ThrottlerModule.forRoot({
      ttl: 60, // Time to live, in seconds
      limit: 100, // Requests within the TTL
    }),
    ServicesModule,
    HelpersModule,
    AuthModule,
    WebsocketModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SwordMerchantsOnlyGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: GqlThrottlerGuard,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: GqlThrottlerGuard,
    // },
    SwordMerchantWithTokenResolver,
    SwordMerchantUserApisResolver,
    SwordUserWalletResolver,
  ],
  controllers: [SwordControllerController],
})
export class HpSwordModule {}
