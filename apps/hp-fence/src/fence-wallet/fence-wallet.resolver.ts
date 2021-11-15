// import { Balance } from '@prisma/client';
import { ServicesService } from '@app/services';
import { SortedBalance } from '@app/services/shared-balance/shared-balance.types';
import { Inject } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Wallet } from '../models/fence-wallet.model';
@Resolver(Wallet)
export class FenceWalletResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}
  @ResolveField()
  async balance(@Parent() wallet: Wallet): Promise<SortedBalance[]> {
    const test =
      await this.services.sharedBalance.getUserWalletWithBalanceWithMerchantsUsers(
        wallet.id,
      );

    return test;
  }
}
