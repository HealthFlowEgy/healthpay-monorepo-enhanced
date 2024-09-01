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

@Resolver()
export class FenceUserApisResolver {
  private readonly logger = new Logger(FenceUserApisResolver.name);
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

  // register mutation
  @Throttle(33, 60 * 60)
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => User, { nullable: true })
  async register(
    @Args('mobile') mobile: string,
    @Args('secret') secret: string,
    @Args('via', { nullable: true }) via: string,
  ) {
    const date = new Date().toISOString();
    const hash = md5(date.split(':')[0] + mobile + date.split(':')[1]);

    if (via === null) {
      via = 'DEFAULT';
    }

    if (hash !== secret) {
      throw new BadRequestException('5006', 'Invalid secret');
    }
    return this.services.sharedUser.doUpsertUser(
      { mobile, firstName: null, lastName: null, email: null },
      false,
      via,
    );
  }
  // register mutation

  // login mutation
  @Throttle(33, 60 * 60)
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => User, { nullable: true })
  async login(
    @Args('mobile') mobile: string,
    @Args('secret') secret: string,
    @Args('via', { nullable: true }) via: string,
  ) {
    const date = new Date().toISOString();
    const hash = md5(date.split(':')[0] + mobile + date.split(':')[1]);

    if (via === null) {
      via = 'DEFAULT';
    }

    if (
      hash !== secret &&
      this.configService.get('NODE_ENV') === 'production'
    ) {
      throw new BadRequestException('5006', 'Invalid secret');
    }
    const user = await this.services.sharedUser.doUpsertUser(
      { mobile, firstName: null, lastName: null, email: null },
      true,
      via,
    );
    // return only email and mobile ommit the rest of the data
    return {
      uid: user.uid,
      mobile: user.mobile,
      email: user.email,
      firstName: 'omitted',
      lastName: 'omitted',
      avatar: 'omitted',
      prefLang: 'omitted',
    };
  }
  // login mutation

  // auth mutation
  @Mutation(() => UserWithToken, { nullable: true })
  async authUser(
    @Args('mobile') mobile: string,
    @Args('otp') otp: string,
    @Args('secret') secret: string,
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
      throw new BadRequestException('4001', 'User does not exist');
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
  // @UsePipes(
  //   new NestjsGraphqlValidator({
  //     firstName: { maxLen: 10, minLen: 1 },
  //     lastName: { maxLen: 10, minLen: 1 },
  //   }),
  // )
  async updateProfile(
    @Args('firstName') firstName: string,
    @Args('lastName') lastName: string,
    @Args('deviceToken', { nullable: true }) deviceToken: string,
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

    const response = await this.services.sharedUser.doUpdateUser({
      ...updateUserInput,
      deviceTokens:
        deviceToken != null
          ? {
              connectOrCreate: {
                where: {
                  user_id_token_unique: {
                    user_id: user.id,
                    token: deviceToken,
                  },
                },
                create: {
                  token: deviceToken,
                },
              },
            }
          : undefined,
      nationalDocFront: undefined,
      nationalDocBack: undefined,
    });

    return response;
  }
  // update profile mutation

  // verify user docs mutation
  @Mutation(() => Success, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  // @UsePipes(
  //   new NestjsGraphqlValidator({
  //     nationalId: { maxLen: 14, minLen: 14 },
  //   }),
  // )
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
      throw new BadRequestException('4001', 'User does not exist');
    }
    try {
      await this.services.sharedUser.deactivateUser(user.id);
      return {
        isSuccess: true,
      };
    } catch (e) {
      throw new BadRequestException('4001', 'User does not exist');
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
