import { ServicesService } from '@app/services';
import { Inject } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Wallet } from '@prisma/client';
import { Balance } from '../models/fence-balance.model';
import { User } from '../models/fence-user.model';

@Resolver(Balance)
export class FenceBalanceResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}

  //   @ResolveField()
  //   async user(@Parent() balance: Balance): Promise<User> {
  //     return this.services.sharedBalance.getBalanceToFromWalletId(balance);
  //   }
}
