import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { Balance } from '@prisma/client';
import { SharedWalletService } from '../shared-wallet/shared-wallet.service';

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
}
