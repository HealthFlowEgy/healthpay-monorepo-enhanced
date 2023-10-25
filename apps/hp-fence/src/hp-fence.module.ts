import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { I18nJsonParser, I18nModule } from 'nestjs-i18n';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FenceBalanceResolver } from './fence-balance/fence-balance.resolver';
import { FenceCashOutApisResolver } from './fence-cashout-apis/fence-cashout-apis.resolver';
import { FenceCashoutMethodResolver } from './fence-cashout-method/fence-cashout-method.resolver';
import { FenceCashoutRequestApisResolver } from './fence-cashout-request-apis/fence-cashout-request-apis.resolver';
import { FenceCashoutRequestResolver } from './fence-cashout-request/fence-cashout-request.resolver';
import { FenceCashoutUserSettingsResolver } from './fence-cashout-user-settings/fence-cashout-user-settings.resolver';
import { FenceFinancingApisResolver } from './fence-financing-apis/fence-financing-apis.resolver';
import { FenceMerchantApisResolver } from './fence-merchant-apis/fence-merchant-apis.resolver';
import { FenceNotificationsApisResolver } from './fence-notifications-apis/fence-notifications-apis.resolver';
import { FenceUserApisResolver } from './fence-user-apis/fence-user-apis.resolver';
import { FenceUserResolver } from './fence-user/fence-user.resolver';
import { FenceWalletApisResolver } from './fence-wallet-apis/fence-wallet-apis.resolver';
import { FenceWalletResolver } from './fence-wallet/fence-wallet.resolver';
import { GqlThrottlerGuard } from './guards/throttle.gaurd';
import { GraphQLModule } from '@nestjs/graphql';
import { HelpersModule } from '@app/helpers';
import { HpFenceController } from './hp-fence.controller';
import { HpFenceService } from './hp-fence.service';
import { Module } from '@nestjs/common';
import { PaymentRequestApisResolver } from './payment-request-apis/payment-request-apis.resolver';
import { ServicesModule } from '@app/services';
import { ValidationsModule } from '@app/validations';
import { WebsocketModule } from '@app/websocket';
import path from 'path';
import { FenceUserMedCardsResolver } from './fence-user-med-cards/fence-user-med-cards.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: true,
      introspection: true,
      buildSchemaOptions: { dateScalarMode: 'timestamp' },
      debug: false,
      driver: ApolloDriver,
      playground: true,
      // introspection: true,
      context: ({ req, connection, ...rest }) =>
        connection ? { req: connection.context, ...rest } : { req, ...rest },
    }),

    EventEmitterModule.forRoot(),

    I18nModule.forRoot({
      fallbackLanguage: 'en',
      parser: I18nJsonParser,
      parserOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
    }),
    ServicesModule,
    HelpersModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      ttl: 60, // Time to live, in seconds
      limit: 100, // Requests within the TTL
    }),
    ValidationsModule,
    WebsocketModule,
  ],
  controllers: [HpFenceController],
  providers: [
    HpFenceService,
    FenceUserApisResolver,
    FenceUserResolver,
    FenceWalletResolver,
    FenceBalanceResolver,
    FenceWalletApisResolver,
    FenceMerchantApisResolver,
    FenceCashOutApisResolver,
    FenceCashoutUserSettingsResolver,
    FenceCashoutMethodResolver,
    FenceCashoutRequestResolver,
    FenceCashoutRequestApisResolver,
    FenceNotificationsApisResolver,
    FenceFinancingApisResolver,
    PaymentRequestApisResolver,
    FenceUserMedCardsResolver,
    // {
    //   provide: APP_GUARD,
    //   useClass: GqlThrottlerGuard,
    // },
  ],
})
export class HpFenceModule {}
