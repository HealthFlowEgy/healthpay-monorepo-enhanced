import { ConfigModule } from '@nestjs/config';
import { HelpersModule } from '@app/helpers';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ServicesService } from './services.service';
import { ShardBillsService } from './shared-bills/shared-bills.service';
import { SharedAuctionService } from './shared-auction/shared-auction.service';
import { SharedBalanceService } from './shared-balance/shared-balance.service';
import { SharedCashOutUserSettingsService } from './shared-cashout-user-settings/shared-cashout-user-settings.service';
import { SharedCashoutMethodService } from './shared-cashout-method/shared-cashout-method.service';
import { SharedCashoutRequestService } from './shared-cashout-request/shared-cashout-request.service';
import { SharedCronService } from './shared-cron/shared-cron.service';
import { SharedFinanceService } from './shared-finance/shared-finance.service';
import { SharedHpOpsService } from './shared-hp-ops/shared-hp-ops.service';
import { SharedKhadamatyService } from './shared-khadamaty/shared-khadamaty.service';
import { SharedMerchantService } from './shared-merchant/shared-merchant.service';
import { SharedNotificationsService } from './shared-notifications/shared-notifications.service';
import { SharedNotifyService } from './shared-notify/shared-notify.service';
import { SharedPaymentRequestService } from './shared-payment-request/shared-payment-request.service';
import { SharedTransactionService } from './shared-transaction/shared-transaction.service';
import { SharedUserService } from './shared-user/shared-user.service';
import { SharedUtxoService } from './shared-utxo/shared-utxo.service';
import { SharedWalletService } from './shared-wallet/shared-wallet.service';
import { SharedWalletSubscriptionService } from './shared-wallet-subscription/shared-wallet-subscription.service';

@Module({
  imports: [
    HelpersModule,
    JwtModule.register({
      secret: 'jwtConstants.secret',
      signOptions: { expiresIn: '1y' },
    }),
    ConfigModule,
    HttpModule.register({
      timeout: 500000,
      maxRedirects: 5,
    }),
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
    SharedWalletSubscriptionService,
    SharedUtxoService,
    SharedCronService,
    SharedNotificationsService,
    SharedFinanceService,
    SharedKhadamatyService,
    SharedAuctionService,
    ShardBillsService,
  ],
  exports: [ServicesService],
})
export class ServicesModule {}
