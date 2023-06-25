import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { WEBSOCKET_EVENTS } from '@app/websocket/websocket-events';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Wallet } from '@prisma/client';
import { SharedBalanceService } from '../shared-balance/shared-balance.service';
import { SharedNotifyService } from '../shared-notify/shared-notify.service';
import { SharedPaymentRequestService } from '../shared-payment-request/shared-payment-request.service';

@Injectable()
export class SharedUtxoService {
  private readonly logger = new Logger(SharedUtxoService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(SharedNotifyService) private sharedNotify: SharedNotifyService,
    @Inject(forwardRef(() => SharedBalanceService))
    private sharedBalance: SharedBalanceService,
    @Inject(SharedPaymentRequestService)
    private sharedPaymentRequests: SharedPaymentRequestService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(WEBSOCKET_EVENTS.UTXO_UPDATE)
  async onUTXOUpdate({ data }: any): Promise<boolean> {
    this.logger.verbose(`UTXO update: ${JSON.stringify(data)}`);
    // update wallet balance

    if (!data || Number.isNaN(data.amount) || data.amount === undefined || data.amount === null || data.amount < 0 ){
      return;
    }

    if (data.publicKey === 'root') {
      return;
    }

    try {
          const userWallet = await this.updateWalletUsingPublicKey(
      data.publicKey,
      data.amount,
    );

    if (data.amount > 0) {
      await this.handlePendingPaymentRequests(userWallet);
    }
    }catch(e){
      this.logger.error(`UTXO update error: ${JSON.stringify(e)}`);
    }

    return true;
  }

  async updateWalletUsingPublicKey(
    publicKey: string,
    amount: number,
  ): Promise<Wallet> {
    const walletId = parseFloat(publicKey);
    return this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        total: parseFloat((amount / 100).toFixed(2)),
      },
    });
  }

  async handlePendingPaymentRequests(userWallet: Wallet): Promise<boolean> {
    const pending = await this.sharedPaymentRequests.getPayablePendingRequests(
      userWallet.userId,
      userWallet.total,
    );
    if (pending.length > 0) {
      this.logger.verbose(
        `Found ${pending.length} pending payment requests for user ${userWallet.userId}`,
      );

      const firstPaymentRequest = pending[0];

      const confirmedBalances = await this.sharedBalance.getAllBalances({
        where: {
          notes: 'pending-payment-request-' + firstPaymentRequest.id,
        },
      });
      if (confirmedBalances.length > 0) {
        if (confirmedBalances[0].confirmedAt) {
          this.logger.error(
            `Payment request ${firstPaymentRequest.id} already confirmed mark as resolved`,
          );
          await this.sharedPaymentRequests.resolvePaymentRequest(
            firstPaymentRequest,
          );
          await this.handlePendingPaymentRequests(userWallet);
          return;
        }
      }

      this.sharedBalance.doTransFromUserToMerchant(
        firstPaymentRequest.merchantId,
        userWallet.userId,
        firstPaymentRequest.amount,
        'pending-payment-request-' + pending[0].id,
      );
      this.sharedPaymentRequests.markPaymentRequestAsProcessing(
        firstPaymentRequest,
      );
    }
    return !!userWallet.id;
  }
}
