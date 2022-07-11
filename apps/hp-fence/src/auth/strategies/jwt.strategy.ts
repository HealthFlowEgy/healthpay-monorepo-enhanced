import { ServicesService } from '@app/services';
import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(ServicesService) private services: ServicesService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
      usernameField: 'uid',
      passwordField: 'mobile',
    });
  }

  async validate(payload: any) {
    const user = await this.services.sharedUser.getUserByMobile(payload.mobile)
    if (user.isDeactivated) {
      throw new Error('4001', 'User is deactivated');
    }
    return {
      ...(await this.services.sharedUser.getUserByMobile(payload.mobile)),
    };
  }
}
