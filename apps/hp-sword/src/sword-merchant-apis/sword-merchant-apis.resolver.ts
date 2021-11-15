import { Inject, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import NestjsGraphqlValidator from 'nestjs-graphql-validator';
import { AuthService } from '../auth/auth.service';
import { ApiHeader } from '../decorators/api-header.decorator';
import { CurrentMerchant } from '../decorators/merchant.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Merchant, MerchantWithToken } from '../models/sword-merchant.model';

@Resolver()
export class SwordMerchantWithTokenResolver {
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
    const merchant = await this.authService.validateUser(apiHeader, apiKey);
    return {
      token: this.authService.login({
        apiKey,
        ...merchant,
      }),
      merchant,
    };
  }

  @Mutation(() => MerchantWithToken, { nullable: true })
  @UseGuards(JwtAuthGuard)
  @UsePipes(
    new NestjsGraphqlValidator({
      firstName: { maxLen: 255, minLen: 1 },
      lastName: { maxLen: 255, minLen: 1 },
      mobile: {
        regExp:
          /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,5})|(\(?\d{2,6}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/,
      },
    }),
  )
  async sendRequestPayToMerchant(
    @Args('amount') amount: number,
    @Args('mobile') mobile: string,
    @Args('firstName') firstName: string,
    @Args('lastName') lastName: string,
    // induced fields
    @CurrentMerchant() thisMerchant: Merchant,
  ) {}
}
