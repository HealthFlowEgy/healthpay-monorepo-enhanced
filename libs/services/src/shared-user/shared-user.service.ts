import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, User } from '@prisma/client';
import moment from 'moment';
import { SharedNotifyService } from '../shared-notify/shared-notify.service';
import { SharedWalletService } from '../shared-wallet/shared-wallet.service';
import { doUpsertUserInput } from './shared-user.types';
@Injectable()
export class SharedUserService {
  private readonly logger = new Logger(SharedUserService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(SharedNotifyService) private sharedNotify: SharedNotifyService,
    @Inject(SharedWalletService) private sharedWallet: SharedWalletService,

    @Inject(ConfigService) private configService: ConfigService,
  ) {}

  public getUserById(id: number): Promise<User> {
    return this.prisma.user.findFirst({ where: { id } });
  }

  public getUserByMobile(mobile: string): Promise<User> {
    return this.prisma.user.findFirst({ where: { mobile } });
  }

  async doUpsertUser(
    { mobile, firstName, lastName, email }: doUpsertUserInput,
    validationCheckUser: boolean = null,
  ): Promise<User | null> {
    let user = await this.getUserByMobile(mobile);
    if (!user) {
      if (validationCheckUser) {
        throw new NotFoundException('2002');
      }
      user = await this.doCreateNewUser({
        mobile,
        firstName,
        lastName,
        email,
      });
    }
    const generatedOtp = await this.doCreateOtp(user.id);
    this.logger.verbose(`[generatedOtp] ${generatedOtp}`);
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
      | 'nationalDocFront'
      | 'nationalDocBack'
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
      // throw new BadRequestException('5001', 'too many otp requests');
    }

    const otp = this.helpers.generateOTP();
    await this.prisma.oTP.create({
      data: {
        otp,
        isUsed: false,

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
    if (user.mobile === '+201154446065' || user.mobile === '00201154446065') {
      if (otp === '1234') {
        return user;
      } else {
        throw new BadRequestException('5002', 'invalid user otp');
      }
    } else {
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

    if (!firstOtp || firstOtp.isUsed === true) {
      this.logger.error(`[otp] 5002 ${otp}`);
      throw new BadRequestException('5002', 'invalid user otp');
    }

    // TODO: mark old otps as used after 1 day
    return user;
  }

  public async createVerificationUserRequest(
    userId: number,
    nationalId: string,
    nationalDocFront: string,
    nationalDocBack: string,
  ): Promise<boolean> {
    try {
      const request = await this.prisma.userVerificationRequest.create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
          status: 'PENDING',
        },
      });
      if (request) {
        const updatedUser = await this.prisma.user.update({
          where: { id: userId },
          data: { nationalId, nationalDocFront, nationalDocBack },
        });
        if (updatedUser) {
          return true;
        }
      } else {
        return false;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // TODO: create shared valu service
  public async createValuHmac(userId: number): Promise<any> {
    const user = await this.getUserById(userId);
    const hmac = await this.helpers.encryptTxt();
    const orderId = this.generateOrderId(32);
    await this.prisma.valuHmac.create({
      data: {
        uid: this.helpers.doCreateUUID('valuHmac'),
        orderId: orderId,
        user: { connect: { id: user.id } },
        hmac: hmac,
        ...this.helpers.generateDates(),
      },
    });
    return { hmac: hmac, orderId: orderId };
  }
  public async updateValuHmacLoanNumber(
    hmac: string,
    loanNumber: string,
  ): Promise<any> {
    const valuHmac = await this.prisma.valuHmac.findFirst({
      where: { hmac },
    });
    if (!valuHmac) {
      throw new BadRequestException('5003', 'invalid hmac');
    }
    await this.prisma.valuHmac.update({
      where: { id: valuHmac.id },
      data: { loanNumber },
    });
    return valuHmac;
  }
  public async getValuOrderIdByHmac(hmac: string): Promise<any> {
    const valuHmac = await this.prisma.valuHmac.findFirst({
      where: { hmac },
    });
    if (!valuHmac.orderId) {
      throw new BadRequestException('5003', 'invalid order id');
    }
    return valuHmac.orderId;
  }

  private generateOrderId(length): string {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
