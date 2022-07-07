import { ServicesService } from '@app/services';
import { Inject, UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GqlThrottlerGuard } from '../guards/throttle.gaurd';
import { Notification } from '../models/fence-notification.model';
import { User } from '../models/fence-user.model';
@Resolver()
export class FenceNotificationsApisResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}
  @Query(() => [Notification])
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async notificationsList(@CurrentUser() user: User): Promise<Notification[]> {
    return (
      await this.services.sharedNotificationsService.getUserNotifications(
        user.id,
      )
    ).map((el) => ({ ...el, vars: JSON.stringify(el.vars) }));
  }
}
