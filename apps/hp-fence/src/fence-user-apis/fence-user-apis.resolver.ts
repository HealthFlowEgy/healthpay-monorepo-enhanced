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

@Resolver()
export class FenceUserApisResolver {
  private readonly logger = new Logger(FenceUserApisResolver.name);
  constructor(
    @Inject(ServicesService) private services: ServicesService,
    @Inject(AuthService) private authService: AuthService,
  ) { }
  // register mutation
  @Throttle(3, 60 * 60)
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => User, { nullable: true })
  async register(@Args('mobile') mobile: string) {
    return this.services.sharedUser.doUpsertUser({ mobile }, false);
  }
  // register mutation

  // login mutation
  @Throttle(3, 60 * 60)
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => User, { nullable: true })
  async login(@Args('mobile') mobile: string) {
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
  async authUser(@Args('mobile') mobile: string, @Args('otp') otp: string) {
    const user = await this.services.sharedUser.doVerifyMobileWithOtp(
      mobile,
      otp,
    );
    const requests = await this.services.sharedFinanceService.requestsByUserId(
      user.id,
    );
    console.log('authUser', requests);
    if (!user) {
      return;
    }
    const loggedInUser = await this.authService.validateUser(
      user.uid,
      user.mobile,
    );
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
      throw new BadRequestException(5005, 'Sorry can not verify your docs');
    }
    return {
      isSuccess: true,
    };
  }
  // verify user docs mutation

  // profile query
  @Query(() => User)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async profile(@CurrentUser() user: User) {
    return user;
  }
  // profile query
}
