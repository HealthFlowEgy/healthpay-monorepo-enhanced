import { ServicesService } from '@app/services';
import {
  BadRequestException,
  Inject,
  UseGuards,
  UsePipes,
  Logger,
} from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import NestjsGraphqlValidator from 'nestjs-graphql-validator';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GqlThrottlerGuard } from '../guards/throttle.gaurd';
import { Success } from '../models/fence-success.model';
import { User, UserWithToken } from '../models/fence-user.model';
import { Throttle } from '@nestjs/throttler';
import { IAM } from '../models/fence.iam.model';
const md5 = require('md5');

@Resolver()
export class FenceUserApisResolver {
  private readonly logger = new Logger(FenceUserApisResolver.name);
  constructor(
    @Inject(ServicesService) private services: ServicesService,
    @Inject(AuthService) private authService: AuthService,
  ) { }

  // iam query
  @Query(() => IAM)
  async iam() {
    return {
      date: new Date().toISOString(),
    }
  }

  // register mutation
  @Throttle(3, 60 * 60)
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => User, { nullable: true })
  async register(@Args('mobile') mobile: string
    , @Args('secret') secret: string
  ) {
    const date = new Date().toISOString();
    const hash = md5(date.split(":")[0] + mobile + date.split(":")[1])
    if (hash !== secret) {
      throw new BadRequestException('5006', 'Invalid secret');
    }
    return this.services.sharedUser.doUpsertUser({ mobile }, false);
  }
  // register mutation

  // login mutation
  @Throttle(3, 60 * 60)
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => User, { nullable: true })
  async login(@Args('mobile') mobile: string,
    @Args('secret') secret: string
  ) {
    const date = new Date().toISOString();
    const hash = md5(date.split(":")[0] + mobile + date.split(":")[1])
    if (hash !== secret) {
      throw new BadRequestException('5006', 'Invalid secret');

    }
    return this.services.sharedUser.doUpsertUser({ mobile }, true);
  }
  // login mutation


  // auth mutation
  @Mutation(() => UserWithToken, { nullable: true })
  @UsePipes(
    new NestjsGraphqlValidator({
      otp: { maxLen: 6, minLen: 1 },
      mobile: {
        regExp:
          /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,5})|(\(?\d{2,6}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/,
      },
    }),
  )
  async authUser(@Args('mobile') mobile: string, @Args('otp') otp: string,
    @Args('secret') secret: string
  ) {
    // const date = new Date().toISOString();
    // const hash = md5(date.split(":")[0] + mobile + date.split(":")[1]) + otp;
    // if (hash !== secret) {
    //   throw new BadRequestException('5006', 'Invalid secret');

    // }
    const user = await this.services.sharedUser.doVerifyMobileWithOtp(
      mobile,
      otp,
    );
    const requests = await this.services.sharedFinanceService.requestsByUserId(
      user.id,
    );
    if (!user) {
      return;
    }
    const loggedInUser = await this.authService.validateUser(
      user.uid,
      user.mobile,
    );
    if (user.isDeactivated) {
      throw new BadRequestException('4001', 'User is deactivated');
    }
    return {
      token: this.authService.login({
        uid: user.uid,
        ...loggedInUser,
      }),
      user: {
        uid: user.uid,
        ...loggedInUser,
      },
    };
  }
  // auth mutation

  // update profile mutation
  @Mutation(() => User, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  @UsePipes(
    new NestjsGraphqlValidator({
      firstName: { maxLen: 10, minLen: 1 },
      lastName: { maxLen: 10, minLen: 1 },
    }),
  )
  async updateProfile(
    @Args('firstName') firstName: string,
    @Args('lastName') lastName: string,
    @Args('email', { nullable: true }) email: string,
    @Args('avatar', { nullable: true }) avatar: string,
    @Args('nationalId', { nullable: true }) nationalId: string,
    @Args('nationalDoc', { nullable: true }) nationalDoc: string,
    @CurrentUser() user: User,
  ) {
    const updateUserInput = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      avatar: avatar,
      nationalId: nationalId,
      nationalDoc: nationalDoc,
      uid: user.uid,
    };
    return this.services.sharedUser.doUpdateUser({
      ...updateUserInput,
    });
  }
  // update profile mutation

  // verify user docs mutation
  @Mutation(() => Success, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  @UsePipes(
    new NestjsGraphqlValidator({
      nationalId: { maxLen: 14, minLen: 14 },
    }),
  )
  async verifyUserDocs(
    @Args('nationalId', { nullable: true }) nationalId: string,
    @Args('nationalDocFront', { nullable: true }) nationalDocFront: string,
    @Args('nationalDocBack', { nullable: true }) nationalDocBack: string,
    @CurrentUser() user: User,
  ) {
    if (user.nationalId && user.nationalDocFront && user.nationalDocBack) {
      throw new BadRequestException(5005, 'User already uploaded docs');
    }
    const request =
      await this.services.sharedUser.createVerificationUserRequest(
        user.id,
        nationalId,
        nationalDocFront,
        nationalDocBack,
      );
    if (!request) {
      throw new BadRequestException('5005', 'Sorry can not verify your docs');
    }
    return {
      isSuccess: true,
    };
  }
  // verify user docs mutation

  // deactivate user mutation
  @Mutation(() => Success, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async deactivateUser(@CurrentUser() user: User) {
    if (user.isDeactivated) {
      throw new BadRequestException(5008, 'User already deactivated');
    }
    try {
      await this.services.sharedUser.deactivateUser(user.id);
      return {
        isSuccess: true,
      };
    } catch (e) {
      throw new BadRequestException(5008, 'Sorry can not deactivate this user');
    }
  }
  // deactivate user mutation

  // profile query
  @Query(() => User)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async profile(@CurrentUser() user: User) {
    return user;
  }
  // profile query
}
