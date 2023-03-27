/* eslint-disable @typescript-eslint/no-unused-vars */
import { ServicesService } from '@app/services';
import { Inject, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FinancingRequest } from '../models/fence-financing-request.model';
import {
  PaymentRequest,
  UpdatablePaymentRequestConsent,
} from '../models/fence-payment-request.model';
import { User } from '../models/fence-user.model';
import { Success } from '../models/fence-success.model';
import { GqlThrottlerGuard } from '../guards/throttle.gaurd';
import { PaymentRequestConsent } from '@prisma/client';


@Resolver()
export class PaymentRequestApisResolver {
  private readonly logger = new Logger(PaymentRequestApisResolver.name);

  constructor(@Inject(ServicesService) private services: ServicesService) {}
  @Query(() => [PaymentRequest])
  @UseGuards(JwtAuthGuard)
  async paymentRequests(@CurrentUser() user: User): Promise<any> {
    return this.services.sharedPaymentRequest.getPendingPaymentRequestsByUserId(
      user.id,
    );
  }

  @Mutation(() => Success, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async sendPaymentRequest(
    @Args('amount') amount: number,
    @Args('recipient') recipient: string,
    @Args('note') note: string,
    @CurrentUser() user: User,
  ) {
    const currentUser = await this.services.sharedUser.getUserById(user.id);
    const recipientUser = await this.services.sharedUser.getUserByMobile(
      recipient,
    );

    if (!recipientUser || currentUser.id === recipientUser.id) {
      throw new BadRequestException('8001', 'Invalid recipient');
    }

    if (
      (
        await this.services.sharedPaymentRequest.getPendingPaymentRequestsByUserId(
          recipientUser.id,
        )
      ).length > 0
    ) {
      throw new BadRequestException(
        '8002',
        'Recipient already has pending requests',
      );
    }

    const created =
      await this.services.sharedPaymentRequest.createPaymentRequest(
        recipientUser,
        amount,
        note,
        null,
        currentUser,
        'PENDING',
      );

    return created && created.id ? { isSuccess: true } : { isSuccess: false };
  }

  @Mutation(() => Success, { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async updatePaymentRequest(
    @Args('id') paymentRequestUID: string,
    @Args({
      name: 'status',
      description: "Required Status to Update to, 'ACCEPTED' or 'REJECTED'",
      type: () => UpdatablePaymentRequestConsent,
    })
    consent: PaymentRequestConsent,
    @CurrentUser() user: User,
  ) {
    const paymentRequest =
      await this.services.sharedPaymentRequest.getPaymentRequest(
        paymentRequestUID,
      );

    if (!paymentRequest) {
      throw new BadRequestException('8003', 'Invalid payment request');
    }

    if (paymentRequest.userId !== user.id) {
      throw new BadRequestException('8004', 'Invalid user');
    }

    if (paymentRequest.status !== 'PENDING') {
      throw new BadRequestException('8005', 'Invalid payment request status');
    }

    this.logger.verbose(
      '[updatePaymentRequest] paymentRequest: ' + paymentRequest.id,
      paymentRequest,
    );
    const transfer = await this.services.sharedBalance.doTransFromUserToUser(
      paymentRequest.senderId,
      paymentRequest.userId,
      paymentRequest.amount,
      'due-to-payment-requests-id-' +
        paymentRequest.id +
        ' ' +
        paymentRequest.note,
    );

    if (transfer && transfer.id) {
      await this.services.sharedPaymentRequest.updatePaymentRequestConsent(
        paymentRequest,
        consent,
      );
      await this.services.sharedPaymentRequest.resolvePaymentRequest(
        paymentRequest,
      );
    }
    return transfer && transfer.id ? { isSuccess: true } : { isSuccess: false };
  }
}
