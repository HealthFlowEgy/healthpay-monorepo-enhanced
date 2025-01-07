/* eslint-disable @typescript-eslint/no-unused-vars */
import { ServicesService } from '@app/services';
import { BadRequestException, Inject, Logger, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
// import NestjsGraphqlValidator from 'nestjs-graphql-validator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GqlThrottlerGuard } from '../guards/throttle.gaurd';
import {
  IGQLBasataServices,
  IGQLBasataTransactionPaymentResponse,
} from '../models/fence-bills.model';
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
  readonly logger = new Logger(FenceBillsAPISResolver.name);

  constructor(@Inject(ServicesService) private services: ServicesService) {}

  @Query(() => IGQLBasataProvidersList)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async getCatalog(): Promise<IGQLBasataProvidersList> {
    return this.services.sharedBillsService.getBillsProviders();
  }

  @Query(() => IGQLBasataServicesList, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async getServicesByProviderId(
    @Args('providerId') providerId: string,
  ): Promise<IGQLBasataServicesList | null> {
    this.logger.log('[on getServicesByProviderId] providerId: ', providerId);
    const data = await this.services.sharedBillsService.getBillsServices(
      Number(providerId),
    );

    if (data == null) {
      throw new BadRequestException(
        '7911',
        "Provider or service doesn't exist",
      );
    }

    return data;
  }

  @Query(() => IGQLBasataServices, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async getServiceById(
    @Args('serviceId') serviceId: string,
  ): Promise<IGQLBasataServices | null> {
    const data = await this.services.sharedBillsService.getServiceById(
      Number(serviceId),
    );

    if (data == null) {
      throw new BadRequestException('7912', "Service doesn't exist");
    }

    return data;
  }

  @Query(() => IGQLBasataServiceInputParams)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async getServiceParamsByServiceId(
    @Args('serviceId') serviceId: string,
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

    this.logger.verbose(
      '[IGQLBasataTransactionInquiryResponse] ',
      transactionInquery,
    );

    const service = await this.services.sharedBillsService.getServiceById(
      Number(serviceId),
    );

    const { userAmount, amount } =
      await this.services.sharedBillsService._caluculateUserPayingAmount(
        service,
        transactionInquery.amount,
        input_parameter_list,
      );

    transactionInquery.min_amount = amount;
    transactionInquery.amount = userAmount;

    return {
      data: transactionInquery.status == 'SUCCESS' ? transactionInquery : null,
      success:
        transactionInquery != null && transactionInquery.status === 'SUCCESS',
    };
  }

  @Mutation(() => IGQLBasataTransactionPaymentResponse)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async transactionPayment(
    @Args('transactionId') transactionId: string,
    @Args('serviceId') serviceId: number,
    @Args('rAmount', { nullable: true }) rAmount: number,

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
        rAmount,
      );
    return {
      data: paymentResponse.data,
      success: paymentResponse.isPaymentProcessed,
    };
  }
}
