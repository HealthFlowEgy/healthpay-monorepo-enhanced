import { HelpersModule } from '@app/helpers';
import { ServicesModule } from '@app/services';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { I18nJsonParser, I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { AuthModule } from './auth/auth.module';
import { SwordMerchantsOnlyGuard } from './guards/sword-merchants-only.guard';
import { SwordMerchantWithTokenResolver } from './sword-merchant-apis/sword-merchant-apis.resolver';
import { SwordMerchantUserApisResolver } from './sword-merchant-user-apis/sword-merchant-user-apis.resolver';
import { SwordUserWalletResolver } from './sword-user-wallet/sword-user-wallet.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      introspection: true,
      buildSchemaOptions: { dateScalarMode: 'timestamp' },
      debug: false,
      // introspection: true,
      context: ({ req, connection }) =>
        connection ? { req: connection.context } : { req },
    }),
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SwordMerchantsOnlyGuard,
    },
    SwordMerchantWithTokenResolver,
    SwordMerchantUserApisResolver,
    SwordUserWalletResolver,
  ],
})
export class HpSwordModule {}
