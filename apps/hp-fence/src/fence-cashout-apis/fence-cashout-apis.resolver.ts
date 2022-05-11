import { ServicesService } from '@app/services';
import { Inject, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'apps/hp-sword/src/guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import { CashOutUserSettings } from '../models/fence-cashout-user-settings.model';
import { User } from '../models/fence-user.model';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CashOutMethod } from '../models/fence-cashout-method.model';
@Resolver()
export class FenceCashOutApisResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}
  @Query(() => [CashOutUserSettings])
  @UseGuards(JwtAuthGuard)
  async cashOutUserSettings(
    @CurrentUser() user: User,
  ): Promise<CashOutUserSettings[]> {
    const settings =
      await this.services.sharedCashOutSettingsService.cashOutSettingsByUserId(
        user.id,
      );
    const cashOutSettings = [];
    settings.map((element) => {
      cashOutSettings.push({
        ...element,
        method: {
          id: element.type.id,
          name: element.type.name,
          abbreviation: element.type.abbreviation,
          bic: element.type.bic,
          createdAt: element.type.createdAt,
          updatedAt: element.type.updatedAt,
        },
      });
    });
    return cashOutSettings;
  }

  @Query(() => [CashOutMethod])
  @UseGuards(JwtAuthGuard)
  async cashOutMethods(): Promise<CashOutMethod[]> {

    return  this.services.sharedCashoutMethod.cashOutMethods();;
  }
  @Mutation(() => CashOutUserSettings)
  @UseGuards(JwtAuthGuard)
  async createCashOutUserSettings(
    @CurrentUser() user: User,
    @Args('creditorNo') creditorNo: string,
    @Args('methodId') methodId: number,
  ): Promise<CashOutUserSettings> {
    const settings =
      await this.services.sharedCashOutSettingsService.doCreateSettings(
        user.id,
        creditorNo,
        methodId,
      );
    const method =
      await this.services.sharedCashoutMethod.cashOutMethodBySettingsId(
        settings.typeId,
      );
    return {
      id: settings.id,
      creditorNo: settings.creditorNo,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
      method,
    };
  }
}
