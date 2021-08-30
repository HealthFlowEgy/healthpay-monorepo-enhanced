import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  Merchant,
  ProviderAuthMerchant,
  User,
  UserAuthMerchant,
} from '@prisma/client';
import { SharedNotifyService } from '../shared-notify/shared-notify.service';
import { SharedUserService } from '../shared-user/shared-user.service';

@Injectable()
export class SharedMerchantService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(SharedUserService) private sharedUser: SharedUserService,
    @Inject(SharedNotifyService) private sharedNotify: SharedNotifyService,
    @Inject(HelpersService) private helpers: HelpersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async isApiHeaderValid(apiHeader: string): Promise<boolean> {
    return !!(
      (await this.prisma.merchant.findMany({ where: { apiHeader } })).length > 0
    );
  }

  async getMerchantByApiHeader(apiHeader: string): Promise<Merchant | null> {
    return this.prisma.merchant.findFirst({ where: { apiHeader } });
  }

  async doCreateLinkToProvider(
    token: string,
    merchantId: number,
    userId: number,
  ): Promise<ProviderAuthMerchant> {
    // revoke old tokens;
    await this.prisma.providerAuthMerchant.deleteMany({
      where: {
        userId,
        merchantId,
      },
    });
    return this.prisma.providerAuthMerchant.create({
      data: {
        uid: this.helpers.doCreateUUID('providerAuthMerchant'),
        token,
        userId,
        merchantId,
        ...this.helpers.generateDates(),
      },
    });
  }

  async doCreateLinkToUser(
    token: string,
    merchantId: number,
    userId: number,
  ): Promise<ProviderAuthMerchant> {
    // revoke old tokens;
    await this.prisma.userAuthMerchant.deleteMany({
      where: {
        userId,
        merchantId,
      },
    });
    return this.prisma.userAuthMerchant.create({
      data: {
        uid: this.helpers.doCreateUUID('userAuthMerchant'),
        token,
        userId,
        merchantId,
        ...this.helpers.generateDates(),
      },
    });
  }

  async getProviderAuthMerchant(
    merchantId: number,
    token: string,
  ): Promise<ProviderAuthMerchant> {
    return this.prisma.providerAuthMerchant.findFirst({
      where: { token, merchantId },
    });
  }

  async getUserAuthMerchant(
    merchantId: number,
    token: string,
  ): Promise<UserAuthMerchant> {
    return this.prisma.userAuthMerchant.findFirst({
      where: { token, merchantId },
    });
  }

  async doLinkUserOrProviderToMerchant(
    merchant: Merchant,
    user: User,
    isProvider: boolean,
  ): Promise<string> {
    const payload = { username: user.id, sub: merchant.id, isProvider };
    const generatedToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('APP_SECRET'),
    });
    if (isProvider) {
      const providerToMerchantLink = await this.doCreateLinkToProvider(
        generatedToken,
        merchant.id,
        user.id,
      );

      return providerToMerchantLink.token;
    } else {
      const userToMerchantLink = await this.doCreateLinkToUser(
        generatedToken,
        merchant.id,
        user.id,
      );

      return userToMerchantLink.token;
    }
  }

  async getUserFromLink(merchant: Merchant, token: string): Promise<User> {
    const merchantLink =
      (await this.getUserAuthMerchant(merchant.id, token)) ||
      (await this.getProviderAuthMerchant(merchant.id, token));
    if (!merchantLink)
      throw new UnauthorizedException(`3002`, 'param: userToken is invalid');

    return this.sharedUser.getUserById(merchantLink.userId);
  }
}
