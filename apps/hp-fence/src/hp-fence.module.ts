import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { I18nJsonParser, I18nModule } from 'nestjs-i18n';
import path from 'path';
import { HpFenceController } from './hp-fence.controller';
import { HpFenceService } from './hp-fence.service';
import { FenceUserApisResolver } from './fence-user-apis/fence-user-apis.resolver';
import { ServicesModule } from '@app/services';
import { HelpersModule } from '@app/helpers';
import { AuthModule } from './auth/auth.module';
import { FenceUserResolver } from './fence-user/fence-user.resolver';
import { FenceWalletResolver } from './fence-wallet/fence-wallet.resolver';
import { FenceBalanceResolver } from './fence-balance/fence-balance.resolver';
import { FenceWalletApisResolver } from './fence-wallet-apis/fence-wallet-apis.resolver';
import { FenceMerchantApisResolver } from './fence-merchant-apis/fence-merchant-apis.resolver';
import { FenceCashOutApisResolver } from './fence-cashout-apis/fence-cashout-apis.resolver';
import { FenceCashoutUserSettingsResolver } from './fence-cashout-user-settings/fence-cashout-user-settings.resolver';
import { FenceCashoutMethodResolver } from './fence-cashout-method/fence-cashout-method.resolver';
import { ValuController } from './valu/valu.controller';
import { ConfigModule } from '@nestjs/config';
import { ValidationsModule } from '@app/validations';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FenceCashoutRequestResolver } from './fence-cashout-request/fence-cashout-request.resolver';
import { FenceCashoutRequestApisResolver } from './fence-cashout-request-apis/fence-cashout-request-apis.resolver';

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
    ConfigModule,
    ValidationsModule,
  ],
  controllers: [HpFenceController, ValuController],
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
  ],
})
export class HpFenceModule {}
