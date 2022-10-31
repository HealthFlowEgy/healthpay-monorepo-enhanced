import { ServicesService } from '@app/services';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class WhiteListedOnly implements CanActivate {
  constructor(
    @Inject(ServicesService)
    private readonly services: ServicesService,
  ) {}

  /**
   *
   * - `2001`: header: api-header is required
   * - `2002`: header: api-header is invalid
   * @param context
   * @returns
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const apiHeader = req.headers['api-header'];
    const ip = req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(',')[0]
      : req.connection.remoteAddress;
    // api-header not present
    if (!apiHeader || apiHeader.length < 2)
      throw new UnauthorizedException('2001', 'header: api-header is required');
    // api-header doesnt exist
    if (
      !(await this.services.sharedMerchant.isApiHeaderValid(apiHeader)) ||
      !(await this.services.sharedMerchant.isValidIpAddress(apiHeader, ip))
    )
      throw new UnauthorizedException(
        '2009',
        'header: api-header is invalid, or ip is not whitelisted',
      );

    return true;
  }
}
