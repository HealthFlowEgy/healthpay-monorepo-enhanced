import { FINANCING_REQUEST_STATUS } from '@prisma/client';
import { HelpersService } from '@app/helpers/helpers.service';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
@Injectable()
export class SharedFinanceService {

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
  ) { }
  async requestsByUserId(userId: number): Promise<any> {
    return this.prisma.financingRequest.findMany({
      where: {
        user: {
          id: userId,
        }
      },

    })
  }
  async createRequest(userId: number, amount: number, reason: string, fullName: string): Promise<any> {
    return this.prisma.financingRequest.create({
      data: {
        uid: this.helpers.doCreateUUID('financingRequest'),
        user: {
          connect: {
            id: userId,
          },
        },
        reason: reason,
        fullName: fullName,
        requestedAmount: amount,
        status: FINANCING_REQUEST_STATUS.PENDING,
      },
    })
  }
}
