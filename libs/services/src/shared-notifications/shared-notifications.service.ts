import { SmsService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class SharedNotificationsService {
  constructor(
    @Inject(SmsService) private smsServ: SmsService,
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(I18nService)
    private readonly i18n: I18nService,
  ) {}

  public async getUserNotifications(userId: number): Promise<any[]> {
    return await this.prisma.notification.findMany({
      where: {
        user: {
          id: userId,
        },
      },
    });
  }
}
