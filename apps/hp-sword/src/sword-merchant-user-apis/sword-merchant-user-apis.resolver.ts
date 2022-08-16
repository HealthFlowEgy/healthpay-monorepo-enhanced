import { ServicesService } from '@app/services';
import { Inject, Logger, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Merchant } from '@prisma/client';
// import NestjsGraphqlValidator from 'nestjs-graphql-validator';
import { CurrentMerchant } from '../decorators/merchant.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Success } from '../models/sword-success.model';
import { Transaction } from '../models/sword-transaction.model';
import { User, UserWithToken } from '../models/sword-user.model';
import { Wallet } from '../models/sword-wallet.model';
import slugify from 'slugify';
import { PaymentRequest } from '../models/sword-payment-requests.model';
import { Throttle } from '@nestjs/throttler';
import { GqlThrottlerGuard } from '../guards/throttle.guard';
import { WhiteListedOnly } from '../guards/whitelisted-only.guard';

@Resolver()
export class SwordMerchantUserApisResolver {
  private readonly logger = new Logger(SwordMerchantUserApisResolver.name);

  constructor(@Inject(ServicesService) private services: ServicesService) {}

  @Mutation(() => User, { nullable: true })
  @Throttle(3, 60 * 60)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  // @UsePipes(
  //   new NestjsGraphqlValidator({
  //     email: { rules: ['isEmail'], orNull: true },
  //     firstName: { maxLen: 255, minLen: 1 },
  //     lastName: { maxLen: 255, minLen: 1 },
  //     mobile: {
  //       regExp:
  //         /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,5})|(\(?\d{2,6}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/,
  //     },
  //   }),
  // )
  async loginUser(
    @Args('mobile') mobile: string,
    @Args('firstName') firstName: string,
    @Args('lastName') lastName: string,
    @Args('email', { nullable: true }) email: string,
    // induced fields
    // @CurrentMerchant() merchant: Merchant,
  ) {
    this.logger.verbose(
      `[loginUser], ${mobile}, ${firstName}, ${lastName}, ${email}`,
    );

    return this.services.sharedUser.doUpsertUser(
      {
        mobile,
        firstName,
        lastName,
        email,
      },
      false,
    );
  }

  @Mutation(() => UserWithToken, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  // @UsePipes(
  //   new NestjsGraphqlValidator({
  //     otp: { maxLen: 6, minLen: 1 },
  //     mobile: {
  //       regExp:
  //         /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,5})|(\(?\d{2,6}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/,
  //     },
  //   }),
  // )
  async authUser(
    @Args('mobile') mobile: string,
    @Args('otp') otp: string,
    @Args('isProvider') isProvider: boolean,
    // induced fields
    @CurrentMerchant() merchant: Merchant,
  ) {
    this.logger.verbose(`[authUser], ${mobile}, ${otp}, ${isProvider}`);

    const user = await this.services.sharedUser.doVerifyMobileWithOtp(
      mobile,
      otp,
    );

    if (!user) {
      return;
    }
    return {
      userToken:
        await this.services.sharedMerchant.doLinkUserOrProviderToMerchant(
          merchant,
          user,
          isProvider,
        ),
      user,
    };
  }

  @Mutation(() => Transaction, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  // @UsePipes(
  //   new NestjsGraphqlValidator({
  //     userToken: { minLen: 5 },
  //     amount: { min: 50, max: 50000 },
  //   }),
  // )
  async topupWalletUser(
    @Args('userToken') userToken: string,
    @Args('amount') amount: number,
    // induced fields
    @CurrentMerchant() merchant: Merchant,
  ) {
    const user = await this.services.sharedMerchant.getUserFromLink(
      merchant,
      userToken,
    );

    this.logger.verbose(`[topupWalletUser], ${amount}, ${user.id}`);

    return this.services.sharedTransaction.doCreateTransaction(
      user,
      amount,
      merchant,
    );
  }

  @Mutation(() => Success, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard, WhiteListedOnly)
  // @UsePipes(
  //   new NestjsGraphqlValidator({
  //     userToken: { minLen: 5 },
  //     amount: { min: 10 },
  //   }),
  // )
  async deductFromUser(
    @Args('userToken') userToken: string,
    @Args('amount') amount: number,
    @Args('description', { nullable: true }) description: string,
    // induced fields
    @CurrentMerchant() merchant: Merchant,
  ) {
    const user = await this.services.sharedMerchant.getUserFromLink(
      merchant,
      userToken,
    );
    //TODO: update notes with code to be integrated with i18n
    return {
      isSuccess: !!(await this.services.sharedBalance.doTransFromUserToMerchant(
        merchant.id,
        user.id,
        amount,
        slugify(description || 'no-description'),
      )),
    };
  }

  @Mutation(() => Success, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard, WhiteListedOnly)
  // @UsePipes(
  //   new NestjsGraphqlValidator({
  //     userToken: { minLen: 5 },
  //     amount: { min: 10 },
  //   }),
  // )
  async sendPaymentRequest(
    @Args('userToken') userToken: string,
    @Args('amount') amount: number,
    // induced fields
    @CurrentMerchant() merchant: Merchant,
  ) {
    const user = await this.services.sharedMerchant.getUserFromLink(
      merchant,
      userToken,
    );

    const wallet = await this.services.sharedWallet.getWalletByUserId(user.id);

    return {
      isSuccess:
        !!(await this.services.sharedPaymentRequest.createPaymentRequest(
          user,
          merchant,
          amount,
        )),
    };
  }

  @Mutation(() => Success, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard, WhiteListedOnly)
  // @UsePipes(
  //   new NestjsGraphqlValidator({
  //     userToken: { minLen: 5 },
  //     amount: { min: 10 },
  //   }),
  // )
  async payToUser(
    @Args('userToken') userToken: string,
    @Args('amount') amount: number,
    @Args('description', { nullable: true }) description: string,
    // induced fields
    @CurrentMerchant() merchant: Merchant,
  ) {
    const user = await this.services.sharedMerchant.getUserFromLink(
      merchant,
      userToken,
    );
    //TODO: update notes with code to be integrated with i18n
    return {
      isSuccess: !!(await this.services.sharedBalance.doTransFromMerchantToUser(
        user.id,
        merchant.id,
        amount,
        slugify(description || 'no-description'),
      )),
    };
  }

  @Mutation(() => Success, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  // @UsePipes(
  //   new NestjsGraphqlValidator({
  //     userToken: { minLen: 5 },
  //     amount: { min: 1 },
  //   }),
  // )
  async logoutUser(
    @Args('userToken') userToken: string,
    // induced fields
    @CurrentMerchant() merchant: Merchant,
  ) {
    const user = await this.services.sharedMerchant.getUserFromLink(
      merchant,
      userToken,
    );
    this.logger.verbose(`[logoutUser], ${user.id} ${user.mobile}`);
    let providerConnected = null;
    const userConnected =
      await this.services.sharedMerchant.getUserAuthMerchant(
        merchant.id,
        userToken,
      );
    if (userConnected) {
      await this.services.sharedMerchant.deleteUserAuthMerchant(
        userConnected.id,
      );
    } else {
      providerConnected =
        await this.services.sharedMerchant.getProviderAuthMerchant(
          merchant.id,
          userToken,
        );
      if (providerConnected) {
        await this.services.sharedMerchant.deleteProverAuthMerchant(
          providerConnected.id,
        );
      }
    }

    return {
      isSuccess: !!userConnected || !!providerConnected,
    };
  }

  @Query(() => [PaymentRequest], { nullable: true })
  @UseGuards(JwtAuthGuard)
  // @UsePipes(
  //   new NestjsGraphqlValidator({
  //     userToken: { minLen: 1 },
  //   }),
  // )
  async userPaymentRequests(
    @Args('userToken') userToken: string,
    // induced fields
    @CurrentMerchant() merchant: Merchant,
  ) {
    const user = await this.services.sharedMerchant.getUserFromLink(
      merchant,
      userToken,
    );
    return this.services.sharedPaymentRequest.getPaymentRequestsByUserId(
      user.id,
    );
  }

  @Query(() => Wallet, { nullable: true })
  @UseGuards(JwtAuthGuard)
  // @UsePipes(
  //   new NestjsGraphqlValidator({
  //     userToken: { minLen: 1 },
  //   }),
  // )
  async userWallet(
    @Args('userToken') userToken: string,
    // induced fields
    @CurrentMerchant() merchant: Merchant,
  ) {
    const user = await this.services.sharedMerchant.getUserFromLink(
      merchant,
      userToken,
    );
    return this.services.sharedWallet.getWalletByUserId(user.id);
  }
}
