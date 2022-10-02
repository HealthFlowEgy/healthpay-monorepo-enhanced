import { ServicesService } from '@app/services';
import { SharedCronService } from '@app/services/shared-cron/shared-cron.service';
import { SharedUtxoService } from '@app/services/shared-utxo/shared-utxo.service';
import { WebsocketService } from '@app/websocket';
import { fromPrisma } from '@app/websocket/transaction';
import { WEBSOCKET_EVENTS } from '@app/websocket/websocket-events';
import { Controller, Get, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Throttle } from '@nestjs/throttler';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Controller('/sword')
export class SwordControllerController {
  constructor(
    @Inject(ServicesService) private services: ServicesService,
    @Inject(WebsocketService) private ws: WebsocketService,
    // @Inject(SharedCronService) private cron: SharedCronService,
    private eventEmitter2: EventEmitter2,
  ) {}

  // @Get('/init')
  // async init(): Promise<string> {
  //   return JSON.stringify(
  //     await this.services.sharedPaymentRequest.getPendingPaymentRequetsWhereWalletHaveMoney(),
  //   );
  // }

  @Get('/init')
  async init(): Promise<string> {
    const wallets = await this.services.sharedWallet.getAllWallets({
      where: { id: { gt: 0 } },
    });

    const transArr = [];

    for (const wallet of wallets) {
      let trans = undefined;
      if (wallet.total > 0) {
        trans = fromPrisma('root', wallet.id, wallet.total, 0, wallet.id);
        this.eventEmitter2.emit(WEBSOCKET_EVENTS.PRISMA_NEW_TX, trans);
        await sleep(1000);
      }
    }

    return JSON.stringify(transArr);
  }

  // @Get('/tryone')
  // async tryone(): Promise<string> {
  //   const pendingRequests =
  //     await this.services.sharedPaymentRequest.getPendingPaymentRequetsWhereWalletHaveMoney();
  //   // for (let index = 0; index < pendingRequests.length; index++) {
  //   //   const pendingRequest = pendingRequests[index];
  //   //   await this.sutxo.handlePendingPaymentRequests(pendingRequest.user.wallet);
  //   // }
  //   await this.services.sharedCronService.payPendingPaymentRequests();
  //   return JSON.stringify(pendingRequests);
  // }
}
