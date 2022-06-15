import { ServicesService } from '@app/services';
import { Inject } from '@nestjs/common';
import { Resolver } from '@nestjs/graphql';
import { Balance } from '../models/fence-balance.model';

@Resolver(Balance)
export class FenceBalanceResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}

  //   @ResolveField()
  //   async user(@Parent() balance: Balance): Promise<User> {
  //     return this.services.sharedBalance.getBalanceToFromWalletId(balance);
  //   }
}
