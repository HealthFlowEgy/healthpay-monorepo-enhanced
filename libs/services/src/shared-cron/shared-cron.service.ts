import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import moment from 'moment';
import { SharedBalanceService } from '../shared-balance/shared-balance.service';
import { SharedPaymentRequestService } from '../shared-payment-request/shared-payment-request.service';

@Injectable()
export class SharedCronService {
  private readonly logger = new Logger(SharedCronService.name);

  constructor(
    @Inject(forwardRef(() => SharedBalanceService))
    private sharedBalance: SharedBalanceService,
    @Inject(SharedPaymentRequestService)
    private sharedPaymentRequests: SharedPaymentRequestService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async revertPendingRequests() {
    const pendingRequests =
      await this.sharedPaymentRequests.getProcessingPaymentRequests({
        where: {
          status: 'CANCELLED',
          updatedAt: {
            lt: moment().subtract(1, 'hour').toISOString(),
          },
        },
      });
    for (let index = 0; index < pendingRequests.length; index++) {
      const pendingStaleRequest = pendingRequests[index];
      await this.sharedPaymentRequests.markPaymentRequestAsPending(
        pendingStaleRequest,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    const pendingBalances = await this.sharedBalance.getAllBalances({
      where: {
        rejectedAt: null,
        confirmedAt: null,
        createdAt: {
          lte: moment().subtract(1, 'day').toISOString(),
        },
      },
    });

    for (let index = 0; index < pendingBalances.length; index++) {
      const balance = pendingBalances[index];
      await this.sharedBalance.markBalanceAsRejected(
        balance,
        'failed-to-be-proccessed',
      );
    }

    const processingRequests =
      await this.sharedPaymentRequests.getProcessingPaymentRequests({
        where: {
          createdAt: {
            lte: moment().subtract(1, 'day').toISOString(),
          },
        },
      });

    for (let index = 0; index < processingRequests.length; index++) {
      const paymentRequest = processingRequests[index];
      await this.sharedPaymentRequests.markPaymentRequestAsPending(
        paymentRequest,
      );
    }

    this.logger.debug(`${pendingBalances.length} pending balances`);
  }
}
