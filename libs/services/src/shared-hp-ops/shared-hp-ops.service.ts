import { Merchant, MerchantType } from '.prisma/client';
import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SharedNotifyService } from '../shared-notify/shared-notify.service';
import { SharedUserService } from '../shared-user/shared-user.service';

@Injectable()
export class SharedHpOpsService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(SharedUserService) private sharedUser: SharedUserService,
    @Inject(SharedNotifyService) private sharedNotify: SharedNotifyService,
    @Inject(HelpersService) private helpers: HelpersService,
    private readonly configService: ConfigService,
  ) {}
  async merchantByType(type: MerchantType): Promise<Merchant> {
    try {
      return await this.prisma.merchant.findFirst({
        where: {
          isHp: type,
        },
      });
    } catch (e) {}
  }
  async cashIn(
    checkAmount: number,
    userId: number,
    amount: number,
  ): Promise<boolean> {
    return true;
  }

  // TODO: cash in fees 0%
  // TODO: transfer => {type: percentage ,  {payable: 20& , receiver: 80%}}
  // TODO: cashout => {type: percentage ,  {user: 20&}
}
