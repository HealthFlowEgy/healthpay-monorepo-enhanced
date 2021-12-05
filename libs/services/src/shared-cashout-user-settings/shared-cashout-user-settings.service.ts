import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import {
  CashOutSettings,
  CashOutTypeLength,
  CashOutTypes,
} from '@prisma/client';

@Injectable()
export class SharedCashOutUserSettingsService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
  ) {}

  public async doCreateSettings(
    userId: number,
    creditorNo: string,
    methodId: number,
  ): Promise<any> {
    return await this.prisma.cashOutSettings.create({
      data: {
        uid: this.helpers.doCreateUUID('cashOutSettings'),
        user: {
          connect: {
            id: userId,
          },
        },
        type: {
          connect: {
            id: methodId,
          },
        },
        ...this.helpers.generateDates(),
        creditorNo,
      },
    });
  }
  public async cashOutSettingsByUserId(userId: number): Promise<any[]> {
    return await this.prisma.cashOutSettings.findMany({
      where: { userId },
      include: { type: true },
    });
  }
  //TODO: move cashout methods to another service
}
