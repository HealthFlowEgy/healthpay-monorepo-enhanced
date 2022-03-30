import { ServicesService } from '@app/services';
import { BadRequestException, Inject, Logger, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CashOutRequest } from '../models/fence-cashout-request.model';
import { Success } from '../models/fence-success.model';
import { User } from '../models/fence-user.model';

@Resolver()
export class FenceCashoutRequestApisResolver {
  private readonly logger = new Logger(FenceCashoutRequestApisResolver.name);

  constructor(@Inject(ServicesService) private services: ServicesService) {}
  @Query(() => [CashOutRequest], { nullable: true })
  @UseGuards(JwtAuthGuard)
  async cashOutRequests(@CurrentUser() user: User): Promise<CashOutRequest[]> {
    return await this.services.sharedCashoutRequestService.requestsByUserId(
      user.id,
    );
  }

  @Mutation(() => CashOutRequest)
  @UseGuards(JwtAuthGuard)
  async createCashOutRequest(
    @CurrentUser() user: User,
    @Args('amount') amount: number,
    @Args('settingsId') settingsId: number,
  ): Promise<CashOutRequest> {
    const wallet = await this.services.sharedWallet.getWalletByUserId(user.id);
    if (wallet.total < amount) {
      throw new BadRequestException('7001', 'Insufficient funds');
    }
    const request =
      await this.services.sharedCashoutRequestService.doCreateCashOutRequest(
        user.id,
        amount,
        settingsId,
      );
    const hpMerchant = await this.services.sharedMerchant.cashInMerchant();
    await this.services.sharedBalance.doTransFromUserToMerchant(
      hpMerchant.id,
      user.id,
      amount,
      'deducted due cashout request',
    );
    try {
      const notifyAdmin = await this.services.sharedUser.getUserByMobile(
        '+201097771130',
      );
      await this.services.sharedNotify
        .toUser(notifyAdmin)
        .compose('cashout')
        .allChannels()
        .send();
    } catch (e) {
      this.logger.error(
        '[FenceCashoutRequestApisResolver.createCashOutRequest.e]',
        e,
      );
    }

    return request;
  }
}
