/* eslint-disable @typescript-eslint/no-unused-vars */
import { ServicesService } from '@app/services';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Merchant } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly services: ServicesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    apiHeader: string,
    apiKey: string,
  ): Promise<Omit<Merchant, 'apiKey'> | null> {
    const merchant = await this.services.sharedMerchant.getMerchantByApiHeader(
      apiHeader,
    );
    if (merchant && merchant.apiKey === apiKey) {
      const { apiKey, ...result } = merchant;
      return result;
    }
    throw new UnauthorizedException('3001', 'param: apiKey is invalid');
  }

  async login(merchant: any): Promise<any> {
    const payload = { username: merchant.apiHeader, sub: merchant.uid };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('APP_SECRET'),
    });
  }
}
