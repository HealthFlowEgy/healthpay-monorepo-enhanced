import { ServicesService } from '@app/services';
import { HttpException, Inject, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
// import NestjsGraphqlValidator from 'nestjs-graphql-validator';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GqlThrottlerGuard } from '../guards/throttle.gaurd';
import { Merchant } from '../models/fence-merchant.model';
import { Success } from '../models/fence-success.model';
import { User } from '../models/fence-user.model';
@Resolver()
export class FenceMerchantApisResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}
  @Query(() => [Merchant])
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async merchantList(): Promise<Merchant[]> {
    return await this.services.sharedMerchant.getMerchantList();
  }

  @Mutation(() => Success, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async transferToMerchant(
    @Args('merchantUID') merchantUID: string,
    @Args('amount') amount: number,
    @CurrentUser() user: User,
  ): Promise<{ isSuccess: boolean }> {
    throw new HttpException('Not implemented', 500);
    const merchant = await this.services.sharedMerchant.getMerchantByUID(
      merchantUID,
    );
    return {
      isSuccess: !!(await this.services.sharedBalance.doTransFromUserToMerchant(
        merchant.id,
        user.id,
        amount,
        '_',
      )),
    };
  }
}
