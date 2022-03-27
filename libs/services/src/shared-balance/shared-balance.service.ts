import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { WEBSOCKET_EVENTS } from '@app/websocket/websocket-events';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Balance, Prisma } from '@prisma/client';
import { SharedWalletService } from '../shared-wallet/shared-wallet.service';
import { SortedBalance } from './shared-balance.types';

@Injectable()
export class SharedBalanceService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(SharedWalletService) private sharedWallet: SharedWalletService,
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
      },
    });
  }

  async doTransFromMerchantToMerchant(
    rMerchantId: number,
    pMerchantId: number,
    amount: number,
    notes?: string,
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
      },
    });
  }

  async doTransFromUserToUser(
    rUserId: number,
    pUserId: number,
    amount: number,
    notes?: string,
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
      },
    });
  }

  async doTransFromUserToMerchant(
    rMerchantId: number,
    pUserId: number,
    amount: number,
    notes?: string,
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
      },
    });
  }

  async getUserWalletWithBalanceWithMerchantsUsers(
    walletId: number,
  ): Promise<SortedBalance[]> {
    const balanceWithWallets = await this.prisma.wallet.findFirst({
      where: {
        id: walletId,
      },
      include: {
        payableBalance: {
          include: {
            receivableMerchant: true,
            receivableWallet: {
              include: {
                user: true,
              },
            },
          },
        },
        receivableBalance: {
          include: {
            payableMerchant: true,
            payableWallet: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
    return this.sortBalance(balanceWithWallets);
  }

  @OnEvent(WEBSOCKET_EVENTS.TX_CONFIRMED)
  async onTxConfirmed({ data }: any) {
    const { signature } = data;
    const balanceId = signature.split('.')[0];
    console.log('[mark_tx_as_confirmed]', balanceId);
    const balance = await this.prisma.balance.findFirst({
      where: { uid: balanceId },
    });
    this.markBalanceAsPaid(balance);
    return;
  }

  @OnEvent(WEBSOCKET_EVENTS.TX_REJECTED)
  async onTxRejected({ data }: any) {
    const { signature } = data;
    const balanceId = signature.split('.')[0];
    console.log('[mark_tx_as_rejected]', balanceId);
    const balance = await this.prisma.balance.findFirst({
      where: { uid: balanceId },
    });
    this.markBalanceAsRejected(balance, 'invalid-transaction-detected');
    return;
  }

  async markBalanceAsPaid(balanceId: Balance): Promise<Balance> {
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
    return this.prisma.balance.update({
      where: {
        uid: balanceId.uid,
      },
      data: {
        rejectedAt: new Date(),
        confirmedAt: null,
        notes,
      },
    });
  }

  private sortBalance(walletBalanceLog: any): SortedBalance[] {
    const creditBalances: SortedBalance[] = [];
    const debitBalances: SortedBalance[] = [];
    walletBalanceLog?.receivableBalance.map((balance) => {
      const { uid, amount, createdAt, payableMerchant, payableWallet } =
        balance;
      creditBalances.push({
        uid,
        amount,
        createdAt,
        merchant: payableMerchant,
        user: payableWallet?.user,
        type: 'CREDIT',
      });
    });
    walletBalanceLog?.payableBalance.map((balance) => {
      const { uid, amount, createdAt, receivableMerchant, receivableWallet } =
        balance;
      debitBalances.push({
        uid,
        amount,
        createdAt,
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
