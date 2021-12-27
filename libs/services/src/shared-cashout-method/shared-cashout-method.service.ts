import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import {
  CashOutSettings,
  CashOutTypeLength,
  CashOutTypes,
} from '@prisma/client';

@Injectable()
export class SharedCashoutMethodService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
  ) {}
  public async cashOutMethods(): Promise<any[]> {
    return await this.prisma.cashOutTypes.findMany({});
  }
  public async cashOutMethodBySettingsId(settingsId: number): Promise<any> {
    const data = await this.prisma.cashOutTypes.findFirst({
      where: {
        id: settingsId,
      },
      include: {
        length: true,
      },
    });
    return data;
  }
  public async cashOutMethodLengthsById(
    methodId: number,
  ): Promise<CashOutTypeLength[]> {
    return this.prisma.cashOutTypeLength.findMany({
      where: {
        cashOutType: {
          every: {
            id: methodId,
          },
        },
      },
    });
  }
}
