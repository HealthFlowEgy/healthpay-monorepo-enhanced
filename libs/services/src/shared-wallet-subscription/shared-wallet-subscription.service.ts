import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { SharedWalletService } from '../shared-wallet/shared-wallet.service';
import { Wallet, WalletSubscription } from '@prisma/client';
import { PrismaService } from '@app/prisma';
import { EventEmitter2 } from '@nestjs/event-emitter';
import moment from 'moment';

@Injectable()
export class SharedWalletSubscriptionService {
  private readonly logger = new Logger(SharedWalletSubscriptionService.name);
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(forwardRef(() => SharedWalletService))
    private sharedWalletService: SharedWalletService,

    private eventEmitter: EventEmitter2,
  ) {}

  defaultPercentage = 0.1;
  defaultFixedAmount = 1000;

  async getCoPaymentAmountFromWalletStrategy(
    totalAmount: number,
    parentWallet: Wallet,
    subWallet: Wallet,
  ): Promise<number> {
    const walletSubscription = await this.getContractBetweenWallets(
      parentWallet,
      subWallet,
    );

    if (!walletSubscription) {
      return 0;
    }

    let coveredByParentAmount = 0;

    switch (walletSubscription.strategy) {
      case 'DEFAULT':
        coveredByParentAmount = await this.getCoverByStrategyDefault(
          totalAmount,
          walletSubscription,
        );
      case 'FIXED':
        coveredByParentAmount = await this.getCoverByStrategyFixedOnly(
          totalAmount,
          walletSubscription,
        );
      case 'PERCENTAGE':
        coveredByParentAmount = await this.getCoverByStrategyPercentageOnly(
          totalAmount,
          walletSubscription,
        );
      default:
        coveredByParentAmount = 0;
    }

    if (Math.floor(parentWallet.total) < coveredByParentAmount) {
      this.logger.verbose(
        "[SharedWalletSubscriptionService] Parent wallet doesn't have enough funds to cover the payment",
      );
      return 0;
    }

    return 0;
  }

  async getContractBetweenWallets(
    parentWallet: Wallet,
    subWallet: Wallet,
    onlyActive = true,
  ): Promise<WalletSubscription | null> {
    return (
      (
        await this.prisma.walletSubscription.findMany({
          where: {
            payerWalletId: parentWallet?.id,
            payeeWalletId: subWallet?.id,
            status: onlyActive ? 'ACTIVE' : undefined,
            activeTo: {
              gte: moment().toISOString(),
            },
          },
        })
      )[0] || null
    );
  }

  /** STRATEGY CALCULATIONS */
  async getCoverByStrategyDefault(
    totalAmount: number,
    walletSubscription: WalletSubscription,
  ): Promise<number> {
    const parentCoverageAmount = totalAmount * this.defaultPercentage;

    if (parentCoverageAmount > this.defaultFixedAmount) {
      return this.defaultFixedAmount;
    }
    return parentCoverageAmount;
  }

  async getCoverByStrategyFixedOnly(
    totalAmount: number,
    walletSubscription: WalletSubscription,
  ): Promise<number> {
    return this.defaultFixedAmount;
  }

  async getCoverByStrategyPercentageOnly(
    totalAmount: number,
    walletSubscription: WalletSubscription,
  ): Promise<number> {
    const parentCoverageAmount = totalAmount * this.defaultPercentage;

    return parentCoverageAmount;
  }
}
