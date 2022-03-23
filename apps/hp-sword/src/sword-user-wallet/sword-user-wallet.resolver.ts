import { ServicesService } from '@app/services';
import { Inject } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Balance } from '../models/sword-balance.model';
import { Wallet } from '../models/sword-wallet.model';

@Resolver(Wallet)
export class SwordUserWalletResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}

  @ResolveField()
  async balance(@Parent() wallet: Wallet): Promise<Balance[]> {
    const { id } = wallet;
    const balances = await this.services.sharedBalance.getBalanceToFromWalletId(
      id,
    );
    return balances.map((el) => ({
      ...el,
      status: el.confirmedAt ? 'confirmed' : el.rejectedAt ? 'rejected' : 'pending',
    }));
  }
}
