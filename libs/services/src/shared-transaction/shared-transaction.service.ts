import { HelpersService } from '@app/helpers';
import { OnelinkService } from '@app/helpers/onelink.service';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { Merchant, Transaction, User } from '@prisma/client';

@Injectable()
export class SharedTransactionService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(OnelinkService) private onelink: OnelinkService,
  ) {}
  public async doCreateTransaction(
    user: User,
    amount: number,
    merchant: Merchant,
  ): Promise<Transaction> {
    const trans = await this.onelink.createTransaction(user, amount);
    return this.prisma.transaction.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        ...this.helpers.generateDates(),
        uid: trans.transaction_id,
        iframeUrl: trans.iframe,
        chargeFromMerchant: {
          connect: {
            id: merchant.id,
          },
        },
        amount,
      },
    });
  }
}
