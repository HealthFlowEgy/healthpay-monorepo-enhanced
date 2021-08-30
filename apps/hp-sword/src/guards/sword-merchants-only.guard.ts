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
export class SwordMerchantsOnlyGuard implements CanActivate {
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
    // api-header not present
    if (!apiHeader || apiHeader.length < 2)
      throw new UnauthorizedException('2001', 'header: api-header is required');
    // api-header doesnt exist
    if (!(await this.services.sharedMerchant.isApiHeaderValid(apiHeader)))
      throw new UnauthorizedException('2002', 'header: api-header is invalid');

    return true;
  }
}
