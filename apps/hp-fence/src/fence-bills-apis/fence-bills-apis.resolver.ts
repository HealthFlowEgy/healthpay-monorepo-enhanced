/* eslint-disable @typescript-eslint/no-unused-vars */
import { ServicesService } from '@app/services';
import { Inject, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
// import NestjsGraphqlValidator from 'nestjs-graphql-validator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GqlThrottlerGuard } from '../guards/throttle.gaurd';
import { IGQLBasataTransactionPaymentResponse } from '../models/fence-bills.model';
import {
  IGQLBasataInputParam,
  IGQLBasataProvidersList,
  IGQLBasataServiceInputParams,
  IGQLBasataServicesList,
  IGQLBasataTransactionInquiryResponse,
} from '../models/fence-bills.model';
import { CurrentUser } from '../decorators/user.decorator';
import { User } from '@prisma/client';

@Resolver()
export class FenceBillsAPISResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) {}

  @Query(() => IGQLBasataProvidersList)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async getCatalog(): Promise<IGQLBasataProvidersList> {
    return this.services.sharedBillsService.getBillsProviders();
  }

  @Query(() => IGQLBasataServicesList)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async getServicesByProviderId(
    @Args('providerId') providerId: string,
  ): Promise<IGQLBasataServicesList> {
    return this.services.sharedBillsService.getBillsServices(
      Number(providerId),
    );
  }

  @Query(() => IGQLBasataServiceInputParams)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async getServiceParamsByServiceId(
    @Args('serviceId') serviceId: number,
  ): Promise<IGQLBasataServiceInputParams> {
    return this.services.sharedBillsService.getServiceInputParams(
      Number(serviceId),
    );
  }

  @Mutation(() => IGQLBasataTransactionInquiryResponse)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async transactionInquiry(
    @Args('serviceId') serviceId: number,
    @Args({
      name: 'input_parameter_list',
      type: () => [IGQLBasataInputParam],
    })
    input_parameter_list: IGQLBasataInputParam[],
  ): Promise<IGQLBasataTransactionInquiryResponse> {
    const transactionInquery =
      await this.services.sharedBillsService.transactionInquiry(
        Number(serviceId),
        input_parameter_list,
      );

    const { userAmount } =
      await this.services.sharedBillsService._caluculateUserPayingAmount(
        serviceId,
        null,
        transactionInquery.amount,
      );

    transactionInquery.amount = userAmount;

    return {
      data: transactionInquery.status == 2 ? transactionInquery : null,
      success: transactionInquery != null && transactionInquery.status === 2,
    };
  }

  @Mutation(() => IGQLBasataTransactionPaymentResponse)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async transactionPayment(
    @Args('transactionId') transactionId: string,
    @Args('serviceId') serviceId: number,
    @Args({
      name: 'input_parameter_list',
      type: () => [IGQLBasataInputParam],
    })
    input_parameter_list: IGQLBasataInputParam[],

    @CurrentUser() user: User,
  ): Promise<IGQLBasataTransactionPaymentResponse> {
    const paymentResponse =
      await this.services.sharedBillsService.payTransaction(
        transactionId,
        input_parameter_list,
        user,
        serviceId,
      );
    return {
      data: paymentResponse.data,
      success: paymentResponse.isPaymentProcessed,
    };
  }
}
