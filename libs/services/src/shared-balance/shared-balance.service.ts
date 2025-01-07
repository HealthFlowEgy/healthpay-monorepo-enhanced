import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { WEBSOCKET_EVENTS } from '@app/websocket/websocket-events';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Balance, Prisma, Wallet } from '@prisma/client';
import { SharedPaymentRequestService } from '../shared-payment-request/shared-payment-request.service';
import { SharedWalletService } from '../shared-wallet/shared-wallet.service';
import { SortedBalance } from './shared-balance.types';

@Injectable()
export class SharedBalanceService {
  private readonly logger = new Logger(SharedBalanceService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(SharedWalletService) private sharedWallet: SharedWalletService,
    @Inject(SharedPaymentRequestService)
    private sharedPaymentRequests: SharedPaymentRequestService,
  ) {}

  public async getAllBalances(
    where: Prisma.BalanceFindManyArgs,
  ): Promise<Balance[]> {
    return this.prisma.balance.findMany(where);
  }

  public async getBalanceToFromWalletId(walletId: number): Promise<Balance[]> {
    return this.prisma.balance.findMany({
      where: {
        OR: [{ payableWalletId: walletId }, { receivableWalletId: walletId }],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
  }

  async doTransFromMerchantToUser(
    rUserId: number,
    pMerchantId: number,
    amount: number,
    notes?: string,
    isDueToWalletSub = false,
  ): Promise<Balance> {
    const rWallet = await this.sharedWallet.getWalletByUserId(rUserId);
    const pWallet = await this.sharedWallet.getWalletByMerchantId(pMerchantId);
    const txId = this.helpers.doCreateUUID('balance');
    await this.sharedWallet.transferAmountBetweenWallets(
      rWallet,
      pWallet,
      amount,
      txId,
      true,
    );
    return this.prisma.balance.create({
      data: {
        uid: txId,
        amount,
        payableMerchant: {
          connect: {
            id: pMerchantId,
          },
        },
        payableWallet: {
          connect: {
            id: pWallet.id,
          },
        },
        receivableWallet: {
          connect: {
            id: rWallet.id,
          },
        },
        type: 'M2U',
        notes,
        isDueToWalletSub,
      },
    });
  }

  async doTransFromMerchantToMerchant(
    rMerchantId: number,
    pMerchantId: number,
    amount: number,
    notes?: string,
    isDueToWalletSub = false,
  ): Promise<Balance> {
    const rWallet = await this.sharedWallet.getWalletByMerchantId(rMerchantId);
    const pWallet = await this.sharedWallet.getWalletByMerchantId(pMerchantId);
    const txID = this.helpers.doCreateUUID('balance');
    await this.sharedWallet.transferAmountBetweenWallets(
      rWallet,
      pWallet,
      amount,
      txID,
      true,
    );
    return this.prisma.balance.create({
      data: {
        uid: txID,
        amount,
        payableMerchant: {
          connect: {
            id: pMerchantId,
          },
        },
        receivableMerchant: {
          connect: {
            id: rMerchantId,
          },
        },
        payableWallet: {
          connect: {
            id: pWallet.id,
          },
        },
        receivableWallet: {
          connect: {
            id: rWallet.id,
          },
        },
        type: 'M2M',
        notes,
        isDueToWalletSub,
      },
    });
  }

  async doTransFromUserToUser(
    rUserId: number,
    pUserId: number,
    amount: number,
    notes?: string,
    isDueToWalletSub = false,
  ): Promise<Balance> {
    const rWallet = await this.sharedWallet.getWalletByUserId(rUserId);
    const pWallet = await this.sharedWallet.getWalletByUserId(pUserId);
    const txID = this.helpers.doCreateUUID('balance');
    await this.sharedWallet.transferAmountBetweenWallets(
      rWallet,
      pWallet,
      amount,
      txID,
      true,
    );
    return this.prisma.balance.create({
      data: {
        uid: txID,
        amount,
        payableWallet: {
          connect: {
            id: pWallet.id,
          },
        },
        receivableWallet: {
          connect: {
            id: rWallet.id,
          },
        },
        type: 'U2U',
        notes,
        isDueToWalletSub,
      },
    });
  }

  async doTransFromUserToMerchant(
    rMerchantId: number,
    pUserId: number,
    amount: number,
    notes?: string,
    isDueToWalletSub = false,
  ): Promise<Balance> {
    const rWallet = await this.sharedWallet.getWalletByMerchantId(rMerchantId);
    const pWallet = await this.sharedWallet.getWalletByUserId(pUserId);
    const txID = this.helpers.doCreateUUID('balance');
    await this.sharedWallet.transferAmountBetweenWallets(
      rWallet,
      pWallet,
      amount,
      txID,
      true,
      true,
    );
    return this.prisma.balance.create({
      data: {
        uid: txID,
        amount,
        receivableMerchant: {
          connect: {
            id: rMerchantId,
          },
        },
        payableWallet: {
          connect: {
            id: pWallet.id,
          },
        },
        receivableWallet: {
          connect: {
            id: rWallet.id,
          },
        },
        type: 'U2M',
        notes,

        isDueToWalletSub,
      },
    });
  }

  // TODO: Make wallet return with start and end date with balance arr
  // TODO: first
  async getUserWalletWithBalanceWithMerchantsUsers(
    walletId: number,
    startDate?: string,
    endDate?: string,
    last?: number,
  ): Promise<SortedBalance[]> {
    let wallet: Wallet;

    if (!startDate && !endDate && !last) {
      wallet = await this.sharedWallet.walletWithAllTranx(walletId);
      return this.sortBalance(wallet);
    }
    if (startDate && !last) {
      wallet = await this.sharedWallet.walletWithRangeDate(
        walletId,
        startDate,
        endDate,
      );
      return this.sortBalance(wallet);
    }
    if (!startDate && !endDate && last) {
      wallet = await this.sharedWallet.walletWithLastTranx(walletId, last);
      return this.sortBalance(wallet);
    }
  }

  @OnEvent(WEBSOCKET_EVENTS.TX_CONFIRMED)
  async onTxConfirmed({ data }: any) {
    const { signature } = data;
    const balanceId = signature.split('.')[0];
    this.logger.verbose(`[mark_tx_as_confirmed] ${balanceId} ${signature}`);
    const balance = await this.prisma.balance.findFirst({
      where: { uid: balanceId },
    });
    if (!balance) {
      this.logger.verbose(
        `[mark_tx_as_confirmed] balance not found ${balanceId}`,
      );
      return;
    }
    this.markBalanceAsPaid(balance);
    return;
  }

  @OnEvent(WEBSOCKET_EVENTS.TX_REJECTED)
  async onTxRejected({ data }: any) {
    const { signature } = data;
    const balanceId = signature.split('.')[0];
    this.logger.verbose(`[mark_tx_as_rejected] ${balanceId} ${signature}`);
    const balance = await this.prisma.balance.findFirst({
      where: { uid: balanceId },
    });
    this.markBalanceAsRejected(balance, 'invalid-transaction-detected');
    return;
  }

  async markBalanceAsPaid(balanceId: Balance): Promise<Balance> {
    // check if this transaction is generated by resolving a payment request //
    if (balanceId.notes.includes('pending-payment-request-')) {
      const paymentRequestId = balanceId.notes.split(
        'pending-payment-request-',
      )[1];
      this.logger.verbose(
        `[markBalanceAsPaid] ${balanceId.uid} found a pending payment request ${paymentRequestId}`,
      );
      const paymentRequest =
        await this.sharedPaymentRequests.getPaymentRequestById(
          parseInt(paymentRequestId),
        );
      await this.sharedPaymentRequests.resolvePaymentRequest(paymentRequest);
    }

    return this.prisma.balance.update({
      where: {
        uid: balanceId.uid,
      },
      data: {
        confirmedAt: new Date(),
        rejectedAt: null,
      },
    });
  }

  async markBalanceAsRejected(
    balanceId: Balance,
    notes?: string,
  ): Promise<Balance> {
    if (balanceId.notes.includes('pending-payment-request-')) {
      const paymentRequestId = balanceId.notes.split(
        'pending-payment-request-',
      )[1];
      const paymentRequest =
        await this.sharedPaymentRequests.getPaymentRequestById(
          parseInt(paymentRequestId),
        );
      await this.sharedPaymentRequests.markPaymentRequestAsPending(
        paymentRequest,
      );
    }

    return this.prisma.balance.update({
      where: {
        uid: balanceId.uid,
      },
      data: {
        rejectedAt: new Date(),
        confirmedAt: null,
        notes: balanceId.notes + '-rejected-' + notes,
      },
    });
  }

  private sortBalance(walletBalanceLog: any): SortedBalance[] {
    const creditBalances: SortedBalance[] = [];
    const debitBalances: SortedBalance[] = [];
    walletBalanceLog?.receivableBalance.map((balance) => {
      const { uid, amount, createdAt, payableMerchant, payableWallet, notes } =
        balance;
      creditBalances.push({
        uid,
        amount,
        createdAt,
        notes,
        merchant: payableMerchant,
        user: payableWallet?.user,
        type: 'CREDIT',
      });
    });
    walletBalanceLog?.payableBalance.map((balance) => {
      const {
        uid,
        amount,
        createdAt,
        receivableMerchant,
        receivableWallet,
        notes,
      } = balance;
      debitBalances.push({
        uid,
        amount,
        createdAt,
        notes,
        merchant: receivableMerchant,
        user: receivableWallet?.user,
        type: 'DEBIT',
      });
    });
    return [...debitBalances, ...creditBalances].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0,
    );
  }
}
