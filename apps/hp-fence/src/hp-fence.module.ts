import { HelpersModule } from '@app/helpers';
import { ServicesModule } from '@app/services';
import { ValidationsModule } from '@app/validations';
import { WebsocketModule } from '@app/websocket';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import { I18nJsonParser, I18nModule } from 'nestjs-i18n';
import path from 'path';
import { AuthModule } from './auth/auth.module';
import { FenceBalanceResolver } from './fence-balance/fence-balance.resolver';
import { FenceCashOutApisResolver } from './fence-cashout-apis/fence-cashout-apis.resolver';
import { FenceCashoutMethodResolver } from './fence-cashout-method/fence-cashout-method.resolver';
import { FenceCashoutRequestApisResolver } from './fence-cashout-request-apis/fence-cashout-request-apis.resolver';
import { FenceCashoutRequestResolver } from './fence-cashout-request/fence-cashout-request.resolver';
import { FenceCashoutUserSettingsResolver } from './fence-cashout-user-settings/fence-cashout-user-settings.resolver';
import { FenceMerchantApisResolver } from './fence-merchant-apis/fence-merchant-apis.resolver';
import { FenceNotificationsApisResolver } from './fence-notifications-apis/fence-notifications-apis.resolver';
import { FenceUserApisResolver } from './fence-user-apis/fence-user-apis.resolver';
import { FenceUserResolver } from './fence-user/fence-user.resolver';
import { FenceWalletApisResolver } from './fence-wallet-apis/fence-wallet-apis.resolver';
import { FenceWalletResolver } from './fence-wallet/fence-wallet.resolver';
import { HpFenceController } from './hp-fence.controller';
import { HpFenceService } from './hp-fence.service';

@Module({
  imports: [
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      introspection: true,
      buildSchemaOptions: { dateScalarMode: 'isoDate' },
      debug: false,
      context: ({ req, connection }) =>
        connection ? { req: connection.context } : { req },
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
    ValidationsModule,
    WebsocketModule
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
  ],
})
export class HpFenceModule { }
