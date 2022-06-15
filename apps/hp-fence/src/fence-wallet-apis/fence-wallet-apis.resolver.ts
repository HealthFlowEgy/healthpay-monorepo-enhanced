import { ServicesService } from '@app/services';
import { Inject, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GqlThrottlerGuard } from '../guards/throttle.gaurd';
import { Transaction } from '../models/fence-transaction.model';
import { User } from '../models/fence-user.model';
import { Wallet } from '../models/fence-wallet.model';

@Resolver()
export class FenceWalletApisResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}
  @Query(() => Wallet)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async userWallet(
    @CurrentUser() user: User,
    @Args('take', { nullable: true }) take: number,
    @Args('startDate', { nullable: true }) startDate: string,
    @Args('endDate', { nullable: true }) endDate: string,
  ) {
    const wallet = await this.services.sharedWallet.getWalletByUserId(user.id);
    const balance =
      await this.services.sharedBalance.getUserWalletWithBalanceWithMerchantsUsers(
        wallet.id,
        startDate,
        endDate,
        take,
      );
    return {
      id: wallet.id,
      total: wallet.total,
      balance: balance,
    };
  }

  @Mutation(() => Transaction, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async topupWalletUser(
    @Args('amount') amount: number,
    @CurrentUser() user: User,
  ) {
    const currentUser = await this.services.sharedUser.getUserById(user.id);
    const merchant = await this.services.sharedMerchant.cashInMerchant();
    return this.services.sharedTransaction.doCreateTransaction(
      currentUser,
      amount,
      merchant,
    );
  }
}
