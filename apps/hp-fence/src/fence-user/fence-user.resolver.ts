import { ServicesService } from '@app/services';
import { Inject } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Wallet } from '@prisma/client';
import { CashOutUserSettings } from '../models/fence-cashout-user-settings.model';
import { User } from '../models/fence-user.model';

@Resolver(User)
export class FenceUserResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}

  // @ResolveField()
  // async wallet(@Parent() user: User): Promise<Wallet> {
  //   return this.services.sharedWallet.getWalletByUserUID(user.uid);
  // }
}
