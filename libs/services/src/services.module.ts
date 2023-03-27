import { HelpersModule } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ServicesService } from './services.service';
import { SharedMerchantService } from './shared-merchant/shared-merchant.service';
import { SharedNotifyService } from './shared-notify/shared-notify.service';
import { SharedUserService } from './shared-user/shared-user.service';
import { SharedWalletService } from './shared-wallet/shared-wallet.service';
import { SharedBalanceService } from './shared-balance/shared-balance.service';
import { SharedTransactionService } from './shared-transaction/shared-transaction.service';
import { SharedCashOutUserSettingsService } from './shared-cashout-user-settings/shared-cashout-user-settings.service';
import { SharedCashoutMethodService } from './shared-cashout-method/shared-cashout-method.service';
import { SharedHpOpsService } from './shared-hp-ops/shared-hp-ops.service';
import { SharedPaymentRequestService } from './shared-payment-request/shared-payment-request.service';
import { SharedUtxoService } from './shared-utxo/shared-utxo.service';
import { SharedCronService } from './shared-cron/shared-cron.service';
import { SharedCashoutRequestService } from './shared-cashout-request/shared-cashout-request.service';
import { SharedNotificationsService } from './shared-notifications/shared-notifications.service';
import { SharedFinanceService } from './shared-finance/shared-finance.service';

@Module({
  imports: [
    HelpersModule,
    JwtModule.register({
      secret: 'jwtConstants.secret',
      signOptions: { expiresIn: '1y' },
    }),
    ConfigModule,
  ],
  providers: [
    SharedCashoutRequestService,
    ServicesService,
    PrismaService,
    SharedUserService,
    SharedMerchantService,
    SharedNotifyService,
    SharedBalanceService,
    SharedTransactionService,
    SharedCashOutUserSettingsService,
    SharedCashoutMethodService,
    SharedHpOpsService,
    SharedPaymentRequestService,
    SharedWalletService,
    SharedUtxoService,
    SharedCronService,
    SharedNotificationsService,
    SharedFinanceService,
  ],
  exports: [ServicesService],
})
export class ServicesModule {}
