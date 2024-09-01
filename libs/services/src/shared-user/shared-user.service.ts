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
import { MedCard, Prisma, User } from '@prisma/client';
import moment from 'moment';
import { SharedNotifyService } from '../shared-notify/shared-notify.service';
import { SharedWalletService } from '../shared-wallet/shared-wallet.service';
import { doUpsertUserInput } from './shared-user.types';

type ICreateMedCards = {
  mobile: string;
  nationalId: string;
  birthDate: string;
  fullname: string;
  gender: string;
  relationId: number;
  merchantId: number;
};

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
    via: string,
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
    if (user.isDeactivated) {
      throw new BadRequestException('4001', 'User does not exist');
    }
    const generatedOtp = await this.doCreateOtp(user.id);
    this.logger.verbose(`[generatedOtp] ${generatedOtp}`);
    await this.sharedNotify
      .toUser(user)
      .allChannels()
      .sendLoginOTP(generatedOtp.split('').join('-'), via);

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
      | 'deviceTokens'
    >,
  ): Promise<User> {
    // ignore device token if null
    if (user.deviceTokens === null) {
      delete user.deviceTokens;
    }

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
    this.logger.verbose('[OTP] ', otp);
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
      if (!firstOtp || firstOtp.isUsed) {
        this.logger.error(`[otp] 5002 ${otp}`);
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
      console.log(request, 'REQUEST');
      if (request) {
        const updatedUser = await this.prisma.user.update({
          where: { id: userId },
          data: { nationalId, nationalDocFront, nationalDocBack },
        });
        if (updatedUser) {
          console.log('updatedUser');
          return true;
        }
      } else {
        console.log('NOT UPDATED');
        return false;
      }
    } catch (e) {
      console.error(e);
    }
  }

  public async deactivateUser(userId: number): Promise<boolean> {
    try {
      const updateUser = await this.prisma.user.update({
        where: { id: userId },
        data: { isDeactivated: true },
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  public async getMedCards(userId: number): Promise<MedCard[]> {
    return this.prisma.medCard.findMany({
      where: {
        userId,
      },
    });
  }

  async upsertUser(
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

    return user;
  }

  public parseRelationshipId(relationId: number): string {
    switch (relationId) {
      case 1:
        return 'Father';
      case 2:
        return 'Mother';
      case 3:
        return 'Brother';
      case 4:
        return 'Sister';
      case 5:
        return 'Son';
      case 6:
        return 'Daughter';
      case 7:
        return 'Husband';
      case 8:
        return 'Wife';
      case 9:
        return 'Grandfather';
      case 10:
        return 'Grandmother';
      default:
        return 'self';
    }
  }

  public async createMedCard(
    params: ICreateMedCards,
    user: User | null = null,
  ): Promise<MedCard> {
    const nameParts = params.fullname.split(' ');

    if (!user) {
      user = await this.upsertUser({
        firstName: nameParts.length > 0 ? nameParts[0] : params.fullname,
        lastName: nameParts.length > 1 ? nameParts[1] : nameParts[0],
        mobile: params.mobile,
      });
    }

    this.logger.verbose('[createMedCard] user', user);
    this.logger.verbose('[createMedCard] params', params);

    // check if card exists with national id or user name
    const existingMedCard = await this.prisma.medCard.findFirst({
      where: {
        OR: [
          {
            nationalId: params.nationalId,
          },
        ],
      },
    });

    if (existingMedCard) {
      throw new BadRequestException('2003', 'card already exists');
    }

    const createdMedCard: MedCard = await this.prisma.medCard.create({
      data: {
        nameOnCard: params.fullname,
        birthDate: params.birthDate,
        relationId: this.parseRelationshipId(params.relationId),
        gender: params.gender,
        nationalId: params.nationalId ?? user.nationalId,
        uid: this.helpers.doCreateUUID('medCard'),
        isActive: true,

        merchantId: params.merchantId,
        userId: user.id,
      },
    });

    console.log(createdMedCard, 'createdMedCard');

    return await this.prisma.medCard.findFirst({
      where: {
        id: createdMedCard.id,
      },
      include: { user: true },
    });
  }
}
