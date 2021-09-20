import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { Balance } from '@prisma/client';
import moment from 'moment';
import { SharedWalletService } from '../shared-wallet/shared-wallet.service';
import { SortedBalance } from './shared-balance.types';

@Injectable()
export class SharedBalanceService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(SharedWalletService) private sharedWallet: SharedWalletService,
  ) {}

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
    await this.sharedWallet.transferAmountBetweenWallets(
      rWallet,
      pWallet,
      amount,
      true,
    );
    return this.prisma.balance.create({
      data: {
        uid: this.helpers.doCreateUUID('balance'),
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
        ...this.helpers.generateDates(),
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
    await this.sharedWallet.transferAmountBetweenWallets(
      rWallet,
      pWallet,
      amount,
      true,
    );
    return this.prisma.balance.create({
      data: {
        uid: this.helpers.doCreateUUID('balance'),
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
        ...this.helpers.generateDates(),
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
    await this.sharedWallet.transferAmountBetweenWallets(
      rWallet,
      pWallet,
      amount,
      true,
    );
    return this.prisma.balance.create({
      data: {
        uid: this.helpers.doCreateUUID('balance'),
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
        ...this.helpers.generateDates(),
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
    await this.sharedWallet.transferAmountBetweenWallets(
      rWallet,
      pWallet,
      amount,
      true,
      true,
    );
    return this.prisma.balance.create({
      data: {
        uid: this.helpers.doCreateUUID('balance'),
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
        ...this.helpers.generateDates(),
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
