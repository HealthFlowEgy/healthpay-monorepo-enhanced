import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { fromPrisma } from '@app/websocket/transaction';
import { WEBSOCKET_EVENTS } from '@app/websocket/websocket-events';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Prisma, Wallet } from '@prisma/client';
import { SharedNotifyService } from '../shared-notify/shared-notify.service';

@Injectable()
export class SharedWalletService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(SharedNotifyService) private sharedNotify: SharedNotifyService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getAllWallets(where?: any): Promise<Wallet[]> {
    return this.prisma.wallet.findMany(where);
  }

  async getWalletByUserId(userId: number): Promise<Wallet> {
    return this.getAndUpdateWallet({
      where: {
        userId,
      },
    });
  }

  async getWalletByUserUID(userUID: string): Promise<Wallet> {
    const wallet = await this.prisma.user
      .findFirst({
        where: {
          uid: userUID,
        },
      })
      .wallet();

    return this.getAndUpdateWallet({ where: { id: wallet.id } });
  }

  async getWalletByMerchantId(merchantId: number): Promise<Wallet> {
    const wallet = await this.prisma.merchant
      .findFirst({
        where: {
          id: merchantId,
        },
      })
      .owner()
      .wallet();
    return this.getAndUpdateWallet({ where: { id: wallet.id } });
  }

  async getWalletById(id: number): Promise<Wallet> {
    return this.getAndUpdateWallet({
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

  async getAndUpdateWallet(where: Prisma.WalletFindFirstArgs): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findFirst(where);
    this.eventEmitter.emit(WEBSOCKET_EVENTS.UTXO_QUERY, wallet);
    return wallet;
  }

  @OnEvent(WEBSOCKET_EVENTS.UTXO_UPDATE)
  async onUTXOUpdate({ data }: any): Promise<boolean> {
    let walletId = 0;
    if (data.publicKey === 'root') {
      const hpMerchant = await this.prisma.merchant.findFirst({
        where: { isHp: 'CASHIN' },
      });
      walletId = hpMerchant.id;
    } else {
      walletId = parseInt(data.publicKey);
    }

    const updateWallet = await this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        total: parseFloat((data.amount / 100).toFixed(2)),
      },
    });
    return !!updateWallet.id;
  }

  async transferAmountBetweenWallets(
    rWallet: Wallet,
    pWallet: Wallet,
    amount: number,
    txId: string,
    safetyCheck?: boolean,
    notify?: boolean,
  ): Promise<boolean> {
    const safety = safetyCheck || true;
    if (safety && pWallet.total < amount)
      throw new ForbiddenException(
        '7001',
        'insufficient funds in payer wallet',
      );

    if (pWallet.total === amount) {
      await this.prisma.wallet.update({
        where: { id: pWallet.id },
        data: {
          total: 0,
        },
      });
    }
    // const updatePayableWallet = await this.prisma.wallet.update({
    //   where: { id: pWallet.id },
    //   data: { total: pWallet.total - amount },
    // });
    // TODO: add healthpay commission
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

    this.eventEmitter.emit(
      WEBSOCKET_EVENTS.PRISMA_NEW_TX,
      fromPrisma(pWallet.id, rWallet.id, amount, 0, txId),
    );

    // const updateReceivableWallet = await this.prisma.wallet.update({
    //   where: { id: rWallet.id },
    //   data: { total: rWallet.total + amount },
    // });
    return true;
  }
}
