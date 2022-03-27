import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import moment from 'moment';
import { SharedBalanceService } from '../shared-balance/shared-balance.service';

@Injectable()
export class SharedCronService {
  private readonly logger = new Logger(SharedCronService.name);

  constructor(
    @Inject(forwardRef(() => SharedBalanceService))
    private sharedBalance: SharedBalanceService,
  ) {}

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

    this.logger.debug(`${pendingBalances.length} pending balances`);
  }
}
