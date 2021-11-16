import { ServicesService } from '@app/services';
import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { HpNodejsService } from './hp-nodejs.service';

@Controller()
export class HpNodejsController {
  constructor(
    private readonly hpNodejsService: HpNodejsService,
    @Inject(ServicesService) private sharedService: ServicesService,
  ) {}

  @Get()
  index(): string {
    throw new NotFoundException();
  }

  @Get('/api/trans/:id')
  async onTxReturnURL(@Param('id') id: string, @Res() res): Promise<string> {
    const tx = await this.sharedService.sharedTransaction.getTransactionByUid(
      id,
    );
    if (!tx) {
      console.log('[invalid_redicted_tx]');
      throw new NotFoundException();
    }
    const merchant = await this.sharedService.sharedMerchant.getMerchantById(
      tx.chargeFromMerchantId,
    );

    res.status(302).redirect(merchant.returnUrl);
    return '';
  }

  @Post('/api/notificationUrl')
  async onNotificationUrl(
    @Res() res,
    @Body() updatedTxBody: any,
  ): Promise<any> {
    const { order_id, status, transaction_id, hash } = updatedTxBody;
    const tx = await this.sharedService.sharedTransaction.getTransactionByUid(
      transaction_id,
    );
    if (!tx) {
      console.log('[invalid_notification_tx]');
      throw new NotFoundException();
    }

    await this.sharedService.sharedTransaction.doUpdateTx(tx.id, {
      status: 'COMPLETED',
    });

    await this.sharedService.sharedBalance.doTransFromMerchantToUser(
      tx.userId,
      6,
      tx.amount,
      'healthpayCashInMerchant',
    );

    return {
      status: 'success',
    };
  }
}
