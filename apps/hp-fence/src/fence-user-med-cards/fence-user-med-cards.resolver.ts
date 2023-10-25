import { ServicesService } from '@app/services';
import { BadRequestException, Inject, Logger, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
// import NestjsGraphqlValidator from 'nestjs-graphql-validator';
import md5 from 'md5';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GqlThrottlerGuard } from '../guards/throttle.gaurd';
import { Success } from '../models/fence-success.model';
import { User, UserWithToken } from '../models/fence-user.model';
import { IAM } from '../models/fence.iam.model';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { MedCard } from '../models/fence.med-card.model';

@Resolver()
export class FenceUserMedCardsResolver {
  private readonly logger = new Logger(FenceUserMedCardsResolver.name);
  constructor(
    @Inject(ServicesService) private services: ServicesService,
    @Inject(AuthService) private authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // iam query
  @Query(() => IAM)
  async iam() {
    return {
      date: new Date().toISOString(),
    };
  }

  @Query(() => MedCard)
  async getMyMedCards(@CurrentUser() user: User) {
    return this.services.sharedUser.getMedCards(user.id);
  }
}
