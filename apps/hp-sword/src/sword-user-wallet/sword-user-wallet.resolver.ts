import { ServicesService } from '@app/services';
import { Inject, Logger } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Balance } from '../models/sword-balance.model';
import { Wallet } from '../models/sword-wallet.model';

@Resolver(Wallet)
export class SwordUserWalletResolver {
  private readonly logger = new Logger(SwordUserWalletResolver.name);
  constructor(@Inject(ServicesService) private services: ServicesService) {}

  @ResolveField()
  async balance(@Parent() wallet: Wallet): Promise<Balance[]> {
    const { id } = wallet;

    const balances = await this.services.sharedBalance.getBalanceToFromWalletId(
      id,
    );

    this.logger.verbose(`[balance] ${balances.length} balances found`);
    return balances
      .filter((b) => b.confirmedAt != null)
      .map((el) => ({
        ...el,
        status: el.confirmedAt
          ? 'confirmed'
          : el.rejectedAt
          ? 'rejected'
          : 'pending',
      }));
  }
}

