import { PrismaModule } from '@app/prisma';
import { ServicesModule } from '@app/services';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { APP_GUARD } from '@nestjs/core';
import { SwordMerchantsOnlyGuard } from './guards/sword-merchants-only.guard';
import { SwordMerchantWithTokenResolver } from './sword-merchant-apis/sword-merchant-apis.resolver';
import { AuthModule } from './auth/auth.module';
import { SwordMerchantUserApisResolver } from './sword-merchant-user-apis/sword-merchant-user-apis.resolver';
import { I18nModule, I18nJsonParser } from 'nestjs-i18n';
import { SwordUserWalletResolver } from './sword-user-wallet/sword-user-wallet.resolver';
import * as path from 'path';
import { HelpersModule } from '@app/helpers';

@Module({
  imports: [
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      buildSchemaOptions: { dateScalarMode: 'timestamp' },
      debug: false,
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
