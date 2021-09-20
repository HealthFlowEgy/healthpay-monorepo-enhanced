import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import moment from 'moment';
import { SharedNotifyService } from '../shared-notify/shared-notify.service';
import { SharedWalletService } from '../shared-wallet/shared-wallet.service';
import { doUpsertUserInput } from './shared-user.types';

@Injectable()
export class SharedUserService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(SharedNotifyService) private sharedNotify: SharedNotifyService,
    @Inject(SharedWalletService) private sharedWallet: SharedWalletService,
  ) {}

  public getUserById(id: number): Promise<User> {
    return this.prisma.user.findFirst({ where: { id } });
  }

  public getUserByMobile(mobile: string): Promise<User> {
    return this.prisma.user.findFirst({ where: { mobile } });
  }

  async doUpsertUser({
    mobile,
    firstName,
    lastName,
    email,
  }: doUpsertUserInput): Promise<User | null> {
    let user = await this.getUserByMobile(mobile);
    if (!user) {
      user = await this.doCreateNewUser({
        mobile,
        firstName,
        lastName,
        email,
      });
    }
    const generatedOtp = await this.doCreateOtp(user.id);

    await this.sharedNotify
      .toUser(user)
      .allChannels()
      .sendLoginOTP(generatedOtp);

    return user;
  }

  public async doCreateNewUser(
    user: Pick<
      Prisma.UserCreateInput,
      'firstName' | 'lastName' | 'email' | 'mobile'
    >,
  ): Promise<User> {
    const createdUser = await this.prisma.user.create({
      data: {
        uid: this.helpers.doCreateUUID('user'),
        ...user,
        ...this.helpers.generateDates(),
      },
    });
    // user initialization
    // 1- create wallet with 0 total
    this.sharedWallet.doCreateWallet(createdUser.id);
    return createdUser;
  }
  public async doUpdateUser(
    user: Pick<
      Prisma.UserUpdateInput,
      | 'firstName'
      | 'lastName'
      | 'email'
      | 'avatar'
      | 'nationalId'
      | 'nationalDoc'
      | 'uid'
    >,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { uid: user.uid as string },
      data: { ...user },
    });
  }
  public async doCreateOtp(userId: number): Promise<string> {
    if ((await this.getOTPSentCountInDuration(userId, 1, 'hour')) >= 4) {
      // TODO: raise an abuse flag for this merchant
      // TODO: handle test user custom otps
      throw new BadRequestException('5001', 'too many otp requests');
    }

    const otp = this.helpers.generateOTP();
    await this.prisma.oTP.create({
      data: {
        otp,
        isUsed: false,
        ...this.helpers.generateDates(),
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
    return otp;
  }

  public async getOTPSentCountInDuration(
    userId: number,
    duration?: number,
    period?: 'hour' | 'day',
  ): Promise<number> {
    return this.prisma.oTP.count({
      where: {
        AND: [
          { userId },
          {
            createdAt: {
              gt: moment()
                .subtract(duration || 1, period || 'hour')
                .toISOString(),
            },
          },
        ],
      },
    });
  }

  public async doVerifyMobileWithOtp(
    mobile: string,
    otp: string,
  ): Promise<User> {
    const user = await this.getUserByMobile(mobile);
    const firstOtp = await this.prisma.oTP.findFirst({
      where: {
        userId: user.id,
        otp,
      },
    });

    if (!firstOtp || firstOtp.isUsed === true) {
      throw new BadRequestException('5002', 'invalid user otp');
    }
    await this.prisma.oTP.update({
      data: {
        isUsed: true,
      },
      where: {
        id: firstOtp.id,
      },
    });

    // TODO: mark old otps as used after 1 day
    return user;
  }
}
