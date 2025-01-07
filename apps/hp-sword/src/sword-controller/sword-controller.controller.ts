import { Controller, Get } from '@nestjs/common';

@Controller('/sword')
export class SwordControllerController {
  constructor() {} // private eventEmitter2: EventEmitter2, // // @Inject(SharedCronService) private cron: SharedCronService, // @Inject(WebsocketService) private ws: WebsocketService, // @Inject(ServicesService) private services: ServicesService,

  // @Get('/init')
  // async init(): Promise<string> {
  //   return JSON.stringify(
  //     await this.services.sharedPaymentRequest.getPendingPaymentRequetsWhereWalletHaveMoney(),
  //   );
  // }

  @Get('/status-check')
  async init(): Promise<{ status: string }> {
    return {
      status: 'ok',
    };
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
