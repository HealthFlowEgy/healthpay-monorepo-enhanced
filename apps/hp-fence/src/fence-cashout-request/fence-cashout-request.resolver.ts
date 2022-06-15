import { ServicesService } from '@app/services';
import { Inject } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CashOutMethod } from '../models/fence-cashout-method.model';
import { CashOutUserSettings } from '../models/fence-cashout-user-settings.model';

@Resolver()
export class FenceCashoutRequestResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}
  // @ResolveField()
  // async cashOutUserSettings(
  //   @Parent() settings: CashOutUserSettings,
  // ): Promise<CashOutMethod> {
  //   return this.services.sharedCashoutMethod.cashOutMethodBySettingsId(
  //     settings.method.id,
  //   );
  // }
}
