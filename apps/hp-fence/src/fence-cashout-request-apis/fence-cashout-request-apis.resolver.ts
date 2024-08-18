import { ServicesService } from '@app/services';
import { BadRequestException, Inject, Logger, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GqlThrottlerGuard } from '../guards/throttle.gaurd';
import { CashOutRequest } from '../models/fence-cashout-request.model';
import { Success, SuccessWithMessage } from '../models/fence-success.model';
import { User } from '../models/fence-user.model';
import { KhadamatyServicePaymentRequest } from '@app/services/shared-khadamaty/khadamaty-service-request';

@Resolver()
export class FenceCashoutRequestApisResolver {
  private readonly logger = new Logger(FenceCashoutRequestApisResolver.name);

  constructor(@Inject(ServicesService) private services: ServicesService) { }
  @Query(() => [CashOutRequest], { nullable: true })
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async cashOutRequests(@CurrentUser() user: User): Promise<CashOutRequest[]> {
    return await this.services.sharedCashoutRequestService.requestsByUserId(
      user.id,
    );
  }

  @Mutation(() => CashOutRequest)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async createCashOutRequest(
    @CurrentUser() user: User,
    @Args('amount') amount: number,
    @Args('settingsId') settingsId: number,
  ): Promise<CashOutRequest> {



    const allPendingRequests =
      await this.services.sharedCashoutRequestService.totalPendingCashoutRequests();
    const totalAmount = allPendingRequests._sum.amount + amount;
    const wallet = await this.services.sharedWallet.getWalletByUserId(user.id);
    const cashout = await this.services.sharedWallet.cashoutSettings();



    if (amount > 200) {
      throw new BadRequestException('7005', 'Maximum cashout amount is 200');
    }

    if (wallet.total < amount) {
      throw new BadRequestException('7001', 'Insufficient funds');
    } else {
      if (!cashout.value) {
        throw new BadRequestException('7001', 'Insufficient funds');
      }
    }

    const pendingUserRequests =
      await this.services.sharedCashoutRequestService.pendingRequestsByUserID(
        user.id,
      );
    if (pendingUserRequests.length > 0) {
      throw new BadRequestException('7002', 'You have a pending request');
    }




    const hpMerchant = await this.services.sharedMerchant.cashInMerchant();
    await this.services.sharedBalance.doTransFromUserToMerchant(
      hpMerchant.id,
      user.id,
      amount,
      'deducted due cashout request',
    );

    const request =
      await this.services.sharedCashoutRequestService.doCreateCashOutRequest(
        user.id,
        amount,
        settingsId,
      );

    try {
      const notifyAdmin = await this.services.sharedUser.getUserByMobile(
        '+201097771130',
        // '+201154446065',
      );
      await this.services.sharedNotify
        .toUser(notifyAdmin)
        .compose('cashout', {
          totalAmount: totalAmount
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ','),
          amount: amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        })
        .allChannels()
        .send('DEFAULT');
    } catch (e) {
      this.logger.error(
        '[FenceCashoutRequestApisResolver.createCashOutRequest.e]',
        e,
      );
    }

    return request;
  }

  @Mutation(() => SuccessWithMessage)
  @UseGuards(JwtAuthGuard, GqlThrottlerGuard)
  async confirmServicePayoutRequest(
    @CurrentUser() user: User,
    @Args('payoutRequestId') payoutRequestId: string,
  ): Promise<SuccessWithMessage> {
    const payoutRequest =
      await this.services.sharedKhadamatyService.getUserPayoutServiceRequest(
        payoutRequestId,
      );

    if (payoutRequest.status != 'PENDING') {
      throw new BadRequestException('1003', 'Invalid payout request');
    }

    const requestDetails: KhadamatyServicePaymentRequest = JSON.parse(
      payoutRequest.fields.toString(),
    );
    const calulcatedAmount = parseFloat(`${requestDetails.amount}`) * 1.02 + 2;

    const wallet = await this.services.sharedWallet.getWalletByUserId(user.id);

    if (wallet.total < calulcatedAmount) {
      throw new BadRequestException('7001', 'Insufficient funds');
    }

    console.log('requestDetails', requestDetails);

    const paymentResponse = await this.services.sharedKhadamatyService.Payment(
      payoutRequest,
    );

    this.logger.verbose(
      '[FenceCashoutRequestApisResolver.confirmServicePayoutRequest.paymentResponse]',
      paymentResponse,
    );

    if (!paymentResponse || paymentResponse.StatusCode != 1) {
      throw new BadRequestException(
        '1004',
        'Payment failed ' +
        paymentResponse.StatusDescription +
        ' ' +
        paymentResponse.BillerStatus,
      );
    }

    const hpMerchant = await this.services.sharedMerchant.cashInMerchant();
    await this.services.sharedBalance.doTransFromUserToMerchant(
      hpMerchant.id,
      user.id,
      calulcatedAmount,
      'deducted due service payout request ' + payoutRequestId,
    );

    await this.services.sharedKhadamatyService.updateUserPayoutServiceRequest(
      payoutRequestId,
      {
        status: 'COMPLETED',
        userId: user.id,
        response: JSON.stringify(paymentResponse),
      },
    );

    return {
      isSuccess: true,
      Receipt: paymentResponse.Reciept,
      amount: calulcatedAmount.toString(),
    };
  }
}
