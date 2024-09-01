import { ServicesService } from '@app/services';
import {
  BadRequestException,
  Inject,
  Logger,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
// import NestjsGraphqlValidator from 'nestjs-graphql-validator';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GqlThrottlerGuard } from '../guards/throttle.gaurd';
import { User } from '../models/fence-user.model';
import { IAM } from '../models/fence.iam.model';
import { MedCard } from '../models/fence.med-card.model';
import { NestjsGraphqlValidator } from '@app/helpers';

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

  @Query(() => [MedCard])
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async getMyMedCards(@CurrentUser() user: User) {
    return this.services.sharedUser.getMedCards(user.id);
  }

  @Mutation(() => MedCard)
  @UsePipes(
    new NestjsGraphqlValidator({
      nationalId: {
        regExp: /^[0-9]{14}$/,
      },
      mobile: {
        // regexp for Egyptian phone number starting with +2
        regExp: /^\+201[0-9]{9}$/,
      },
      gender: {
        enum: ['m', 'f'],
      },
      birthDate: {
        regExp: /^\d{4}-\d{2}-\d{2}$/,
      },
    }),
  )
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async createMedCard(
    @Args('fullName') fullname: string,
    @Args('nationalId') nationalId: string,
    @Args('birthDate') birthDate: string,
    @Args('gender') gender: string,
    @Args('relationId', { nullable: true }) relationId: number,
    @CurrentUser() user: User,
  ) {
    if (['m', 'f'].indexOf(gender) === -1) {
      throw new BadRequestException('422', 'invalid user gender');
    }

    const amount = this.configService.get<number>('medCardAmount', 500);

    const wallet = await this.services.sharedWallet.getWalletByUserId(user.id);
    if (wallet.total < amount) {
      throw new BadRequestException('7001', 'Insufficient funds');
    }

    const currentUser = await this.services.sharedUser.getUserById(user.id);
    const hpMerchant = await this.services.sharedMerchant.cashInMerchant();

    const medCard = this.services.sharedUser.createMedCard(
      {
        mobile: currentUser.mobile,
        nationalId,
        birthDate,
        fullname,
        gender,
        relationId,
        merchantId: hpMerchant.id,
      },
      currentUser,
    );

    await this.services.sharedBalance.doTransFromUserToMerchant(
      hpMerchant.id,
      user.id,
      amount,
      'deducted due medical card creation',
    );

    return medCard;
  }
}
