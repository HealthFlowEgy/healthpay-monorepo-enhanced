import { Inject, Injectable } from '@nestjs/common';
import { SharedBalanceService } from './shared-balance/shared-balance.service';
import { SharedCashoutMethodService } from './shared-cashout-method/shared-cashout-method.service';
import { SharedCashoutRequestService } from './shared-cashout-request/shared-cashout-request.service';
import { SharedCashOutUserSettingsService } from './shared-cashout-user-settings/shared-cashout-user-settings.service';
import { SharedMerchantService } from './shared-merchant/shared-merchant.service';
import { SharedNotificationsService } from './shared-notifications/shared-notifications.service';
import { SharedNotifyService } from './shared-notify/shared-notify.service';
import { SharedTransactionService } from './shared-transaction/shared-transaction.service';
import { SharedUserService } from './shared-user/shared-user.service';
import { SharedWalletService } from './shared-wallet/shared-wallet.service';

@Injectable()
export class ServicesService {
  constructor(
    @Inject(SharedUserService) public sharedUser: SharedUserService,
    @Inject(SharedWalletService) public sharedWallet: SharedWalletService,
    @Inject(SharedMerchantService) public sharedMerchant: SharedMerchantService,
    @Inject(SharedNotifyService) public sharedNotify: SharedNotifyService,
    @Inject(SharedBalanceService) public sharedBalance: SharedBalanceService,
    @Inject(SharedCashOutUserSettingsService)
    public sharedCashOutSettingsService: SharedCashOutUserSettingsService,
    @Inject(SharedCashoutMethodService)
    public sharedCashoutMethod: SharedCashoutMethodService,
    @Inject(SharedTransactionService)
    public sharedTransaction: SharedTransactionService,
    @Inject(SharedCashoutRequestService)
    public sharedCashoutRequestService: SharedCashoutRequestService,
    @Inject(SharedNotificationsService)
    public sharedNotificationsService: SharedNotificationsService,
  ) {}
}
