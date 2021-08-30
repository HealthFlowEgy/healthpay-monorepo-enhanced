import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Wallet } from '@prisma/client';
import { SharedNotifyService } from '../shared-notify/shared-notify.service';

@Injectable()
export class SharedWalletService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(SharedNotifyService) private sharedNotify: SharedNotifyService,
  ) {}

  async getWalletByUserId(userId: number): Promise<Wallet> {
    return this.prisma.wallet.findFirst({
      where: {
        userId,
      },
    });
  }

  async getWalletByMerchantId(merchantId: number): Promise<Wallet> {
    return this.prisma.merchant
      .findFirst({
        where: {
          id: merchantId,
        },
      })
      .owner()
      .wallet();
  }

  async getWalletById(id: number): Promise<Wallet> {
    return this.prisma.wallet.findFirst({
      where: {
        id,
      },
    });
  }

  async doCreateWallet(ownerId: number): Promise<Wallet> {
    return this.prisma.wallet.create({
      data: {
        total: 0,
        user: {
          connect: {
            id: ownerId,
          },
        },
      },
    });
  }

  async transferAmountBetweenWallets(
    rWallet: Wallet,
    pWallet: Wallet,
    amount: number,
    safetyCheck?: boolean,
    notify?: boolean,
  ): Promise<boolean> {
    const safety = safetyCheck || true;
    if (safety && pWallet.total < amount)
      throw new ForbiddenException(
        '7001',
        'insufficient funds in payer wallet',
      );
    const updatePayableWallet = await this.prisma.wallet.update({
      where: { id: pWallet.id },
      data: { total: pWallet.total - amount },
    });
    // TODO: add healthpay commission
    // TODO: send balance update notifications
    if (notify) {
      const pUser = await this.prisma.wallet
        .findFirst({ where: { id: pWallet.id } })
        .user();
      this.sharedNotify
        .toUser(pUser)
        .compose('deduct', { amount })
        .allChannels()
        .send();
    }

    const updateReceivableWallet = await this.prisma.wallet.update({
      where: { id: rWallet.id },
      data: { total: rWallet.total + amount },
    });
    return !!(updateReceivableWallet.id && updatePayableWallet.id);
  }
}
