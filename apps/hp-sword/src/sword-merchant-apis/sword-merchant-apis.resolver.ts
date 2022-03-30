import { Inject, Logger, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import NestjsGraphqlValidator from 'nestjs-graphql-validator';
import { AuthService } from '../auth/auth.service';
import { ApiHeader } from '../decorators/api-header.decorator';
import { CurrentMerchant } from '../decorators/merchant.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Merchant, MerchantWithToken } from '../models/sword-merchant.model';

@Resolver()
export class SwordMerchantWithTokenResolver {
  private readonly logger = new Logger(SwordMerchantWithTokenResolver.name);
  constructor(
    @Inject(AuthService)
    private authService: AuthService,
  ) {}

  @Query(() => Merchant, { name: 'stub' })
  async stub() {
    return null;
  }

  // merchant login
  @Mutation(() => MerchantWithToken, { nullable: true })
  async authMerchant(
    @Args('apiKey') apiKey: string,
    @ApiHeader() apiHeader: string,
  ) {
    this.logger.verbose(`[authMerchant], ${apiKey}`);
    const merchant = await this.authService.validateUser(apiHeader, apiKey);
    return {
      token: this.authService.login({
        apiKey,
        ...merchant,
      }),
      merchant,
    };
  }
}
