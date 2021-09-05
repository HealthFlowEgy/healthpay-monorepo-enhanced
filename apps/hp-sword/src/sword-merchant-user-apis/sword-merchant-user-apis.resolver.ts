import { ServicesService } from '@app/services';
import { Inject, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Merchant } from '@prisma/client';
import NestjsGraphqlValidator from 'nestjs-graphql-validator';
import { CurrentMerchant } from '../decorators/merchant.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Success } from '../models/sword-success.model';
import { Transaction } from '../models/sword-transaction.model';
import { User, UserWithToken } from '../models/sword-user.model';
import { Wallet } from '../models/sword-wallet.model';

@Resolver()
export class SwordMerchantUserApisResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}

  @Mutation(() => User, { nullable: true })
  @UseGuards(JwtAuthGuard)
  @UsePipes(
    new NestjsGraphqlValidator({
      email: { rules: ['isEmail'], orNull: true },
      firstName: { maxLen: 255, minLen: 1 },
      lastName: { maxLen: 255, minLen: 1 },
      mobile: {
        regExp:
          /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,5})|(\(?\d{2,6}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/,
      },
    }),
  )
  async loginUser(
    @Args('mobile') mobile: string,
    @Args('firstName') firstName: string,
    @Args('lastName') lastName: string,
    @Args('email', { nullable: true }) email: string,
    // induced fields
    // @CurrentMerchant() merchant: Merchant,
  ) {
    return this.services.sharedUser.doUpsertUser({
      mobile,
      firstName,
      lastName,
      email,
    });
  }

  @Mutation(() => UserWithToken, { nullable: true })
  @UseGuards(JwtAuthGuard)
  @UsePipes(
    new NestjsGraphqlValidator({
      otp: { maxLen: 6, minLen: 1 },
      mobile: {
        regExp:
          /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,5})|(\(?\d{2,6}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/,
      },
    }),
  )
  async authUser(
    @Args('mobile') mobile: string,
    @Args('otp') otp: string,
    @Args('isProvider') isProvider: boolean,
    // induced fields
    @CurrentMerchant() merchant: Merchant,
  ) {
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
  @UseGuards(JwtAuthGuard)
  @UsePipes(
    new NestjsGraphqlValidator({
      userToken: { minLen: 5 },
    }),
  )
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
    return this.services.sharedTransaction.doCreateTransaction(
      user,
      amount,
      merchant,
    );
  }

  @Mutation(() => Success, { nullable: true })
  @UseGuards(JwtAuthGuard)
  @UsePipes(
    new NestjsGraphqlValidator({
      userToken: { minLen: 5 },
    }),
  )
  async deductFromUser(
    @Args('userToken') userToken: string,
    @Args('amount') amount: number,
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
        '_',
      )),
    };
  }

  @Mutation(() => Success, { nullable: true })
  @UseGuards(JwtAuthGuard)
  @UsePipes(
    new NestjsGraphqlValidator({
      userToken: { minLen: 5 },
    }),
  )
  async payToUser(
    @Args('userToken') userToken: string,
    @Args('amount') amount: number,
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
        '_',
      )),
    };
  }

  @Query(() => Wallet, { nullable: true })
  @UseGuards(JwtAuthGuard)
  @UsePipes(
    new NestjsGraphqlValidator({
      userToken: { minLen: 1 },
    }),
  )
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
