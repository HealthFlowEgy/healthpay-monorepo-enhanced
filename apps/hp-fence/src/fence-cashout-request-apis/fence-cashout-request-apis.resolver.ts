import { ServicesService } from '@app/services';
import { BadRequestException, Inject, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CashOutRequest } from '../models/fence-cashout-request.model';
import { Success } from '../models/fence-success.model';
import { User } from '../models/fence-user.model';

@Resolver()
export class FenceCashoutRequestApisResolver {
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
    return request;
  }
}
