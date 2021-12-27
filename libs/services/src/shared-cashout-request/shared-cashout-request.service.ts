import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { CashOutRequest } from '@prisma/client';

@Injectable()
export class SharedCashoutRequestService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
  ) {}

  public async requestsByUserId(userId: number): Promise<CashOutRequest[]> {
    const requests = this.prisma.cashOutRequest.findMany({
      where: {
        userId,
      },
      include: {
        cashOutMethod: {
          include: {
            type: true,
            user: true,
          },
        },
      },
    });
    return requests;
  }

  public async doCreateCashOutRequest(
    userId: number,
    amount: number,
    settingsId: number,
  ): Promise<CashOutRequest> {
    const request = await this.prisma.cashOutRequest.create({
      data: {
        uid: this.helpers.doCreateUUID('cashOutRequest'),
        amount,
        user: {
          connect: {
            id: userId,
          },
        },
        status: 'PENDING',
        ...this.helpers.generateDates(),
        cashOutMethod: {
          connect: {
            id: settingsId,
          },
        },
      },
    });
    return request;
  }
}
