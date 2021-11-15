import { ServicesService } from '@app/services';
import { Inject } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CashOutMethodLength } from '../models/fence-cashout-method-length.model';
import { CashOutMethod } from '../models/fence-cashout-method.model';
import { CashOutUserSettings } from '../models/fence-cashout-user-settings.model';

@Resolver(CashOutMethod)
export class FenceCashoutMethodResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}
  @ResolveField()
  async length(
    @Parent() method: CashOutMethod,
  ): Promise<CashOutMethodLength[]> {
    return this.services.sharedCashoutMethod.cashOutMethodLengthsById(
      method.id,
    );
  }
}
