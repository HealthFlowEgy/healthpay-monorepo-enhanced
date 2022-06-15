import { ServicesService } from '@app/services';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;;
    console.log('[GqlThrottlerGuard.getTracker]', req.ip, req.ips , ip);
    return req.ips.length ? req.ips[0] : req.ip;
  }

  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }
}
