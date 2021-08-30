import { Inject, Injectable } from '@nestjs/common';
import { SharedBalanceService } from './shared-balance/shared-balance.service';
import { SharedMerchantService } from './shared-merchant/shared-merchant.service';
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
    @Inject(SharedNotifyService) public shaerdNotify: SharedNotifyService,
    @Inject(SharedBalanceService) public sharedBalance: SharedBalanceService,
    @Inject(SharedTransactionService)
    public sharedTransaction: SharedTransactionService,
  ) {}
}
