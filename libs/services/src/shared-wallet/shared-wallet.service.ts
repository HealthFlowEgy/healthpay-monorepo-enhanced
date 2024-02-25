import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { fromPrisma } from '@app/websocket/transaction';
import { WEBSOCKET_EVENTS } from '@app/websocket/websocket-events';
import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Wallet } from '@prisma/client';
import { SharedBalanceService } from '../shared-balance/shared-balance.service';
import { SharedNotifyService } from '../shared-notify/shared-notify.service';
import { SharedPaymentRequestService } from '../shared-payment-request/shared-payment-request.service';
import { SharedWalletSubscriptionService } from '../shared-wallet-subscription/shared-wallet-subscription.service';
import { sleep } from '../shared-cron/shared-cron.service';

@Injectable()
export class SharedWalletService {
  private readonly logger = new Logger(SharedWalletService.name);
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(SharedNotifyService) private sharedNotify: SharedNotifyService,

    @Inject(forwardRef(() => SharedBalanceService))
    private sharedBalance: SharedBalanceService,

    @Inject(forwardRef(() => SharedWalletSubscriptionService))
    private sharedWalletSubscription: SharedWalletSubscriptionService,

    @Inject(SharedPaymentRequestService)
    private sharedPaymentRequests: SharedPaymentRequestService,

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
  async cashoutSettings(): Promise<any> {
    return this.prisma.siteSettings.findFirst({
      where: {
        key: 'cashout',
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
        // financingAmount: 0,
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

  /**
   * main function to transfer amount between wallets
   *
   * @param rWallet receivable wallet
   * @param pWallet payer wallet
   * @param amount amount to transfer
   * @param txId transaction id
   * @param safetyCheck
   * @param notify notify user about the transaction
   * @returns boolean
   */
  async transferAmountBetweenWallets(
    rWallet: Wallet,
    pWallet: Wallet,
    amount: number,
    txId: string,
    safetyCheck?: boolean,
    notify?: boolean,
  ): Promise<boolean> {
    let amountFromParentWallet = 0;

    const parentWallet = await this.getParentWallets(pWallet);
    // check if there are parent wallets
    if (parentWallet != null) {
      const defaultWallet = await this.getDefaultParentWallet(pWallet);

      amountFromParentWallet =
        await this.sharedWalletSubscription.getCoPaymentAmountFromWalletStrategy(
          amount,
          defaultWallet,
          pWallet,
        );

      if (amountFromParentWallet > 0) {
        await this.sharedBalance.doTransFromUserToUser(
          rWallet.userId,
          defaultWallet.userId,
          amountFromParentWallet,
          'deducted due to wallet subscription payment',
          true,
        );

        // temporary fix for the total amount (assumed to be transferred from parent wallet to user wallet)
        pWallet.total = pWallet.total + amountFromParentWallet;

        await sleep(5000);
      }
    }

    const safety = safetyCheck || true;
    if (safety && pWallet.total < amount) {
      this.logger.error(`[transferAmountBetweenWallets] 7001 ${pWallet.id}`);
      throw new ForbiddenException(
        '7001',
        'insufficient funds in payer wallet',
      );
    }

    if (Math.floor(pWallet.total) === Math.floor(amount)) {
      this.logger.verbose('[transferAmountBetweenWallets] User Wallet Total 0');
      await this.prisma.wallet.update({
        where: { id: pWallet.id },
        data: {
          total: 0,
        },
      });
    }

    // TODO: add healthpay commission
    if (notify) {
      const pUser = await this.prisma.wallet
        .findFirst({ where: { id: pWallet.id } })
        .user();

      this.sharedNotify
        .toUser(pUser)
        .compose('deduct', { amount })
        .notify()
        .send('default');
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

  async getParentWallets(
    wallet: Wallet,
    defaultOnly = false,
  ): Promise<Wallet[]> {
    return (
      await this.prisma.walletSubscription.findMany({
        where: {
          isDefault: defaultOnly == true ? true : undefined,
          payeeWalletId: wallet.id,
        },
        include: {
          payerWallet: {
            include: {
              user: true,
            },
          },
        },
      })
    ).map((ws) => ({
      ...ws,
      ...ws.payerWallet,
    }));
  }

  async getDefaultParentWallet(wallet: Wallet): Promise<Wallet | null> {
    const subToWallets = await this.getParentWallets(wallet, true);
    return subToWallets[0] || null;
  }

  async walletWithStartDate(
    walletId: number,
    startDate: string,
  ): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        id: walletId,
      },
      include: {
        payableBalance: {
          where: {
            createdAt: {
              gte: startDate,
            },
          },
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
          where: {
            createdAt: {
              gte: startDate,
            },
          },
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
    return wallet;
  }

  async walletWithEndDate(walletId: number, endDate: string): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        id: walletId,
      },
      include: {
        payableBalance: {
          where: {
            createdAt: {
              lte: endDate,
            },
          },
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
          where: {
            createdAt: {
              lte: endDate,
            },
          },
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
    return wallet;
  }
  async walletWithStartEndDate(
    walletId: number,
    startDate: string,
    endDate: string,
  ): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        id: walletId,
      },
      include: {
        payableBalance: {
          where: {
            AND: [
              {
                createdAt: {
                  gte: startDate,
                },
              },
              {
                createdAt: {
                  lte: endDate,
                },
              },
            ],
          },
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
          where: {
            AND: [
              {
                createdAt: {
                  gte: startDate,
                },
              },
              {
                createdAt: {
                  lte: endDate,
                },
              },
            ],
          },
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
    return wallet;
  }
  async walletWithRangeDate(
    walletId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<Wallet> {
    let wallet = null;
    if (startDate) {
      wallet = await this.walletWithStartDate(walletId, startDate);
      return wallet;
    } else if (endDate) {
      wallet = await this.walletWithEndDate(walletId, endDate);
      return wallet;
    } else if (startDate && endDate) {
      wallet = await this.walletWithStartEndDate(walletId, startDate, endDate);
      return wallet;
    }
  }
  async walletWithLastTranx(walletId: number, take: number): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        id: walletId,
      },
      include: {
        payableBalance: {
          take: take,
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
          take: take,
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

    return wallet;
  }
  async walletWithAllTranx(walletId: number): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findFirst({
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

    return wallet;
  }
}
