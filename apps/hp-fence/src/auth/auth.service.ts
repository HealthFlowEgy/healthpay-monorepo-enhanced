/* eslint-disable @typescript-eslint/no-unused-vars */
import { ServicesService } from '@app/services';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly services: ServicesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    userUID: string,
    mobile: string,
  ): Promise<Omit<User, 'uid'>> {
    const user = await this.services.sharedUser.getUserByMobile(mobile);
    if (user.uid != userUID) throw new UnauthorizedException('2001');
    const { uid, ...result } = user;
    return result;
  }

  async login(user: any): Promise<any> {
    const payload = { username: user.uid, sub: user.mobile, ...user };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('APP_SECRET'),
    });
  }
}
