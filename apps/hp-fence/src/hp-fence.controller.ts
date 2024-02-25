import { Controller, Get, Inject } from '@nestjs/common';
import { HpFenceService } from './hp-fence.service';
import { ServicesService } from '@app/services';

@Controller()
export class HpFenceController {
  constructor(
    private readonly hpFenceService: HpFenceService,
    @Inject(ServicesService)
    private serviceService: ServicesService,
  ) { }


  @Get('/sendFCM')
  async sendFCM(): Promise<any> {
    const message = 'Hello from FCM';


    const puser = await this.serviceService.sharedUser.getUserById(95);

    this.serviceService.sharedNotify
      .toUser(puser)
      .compose('auction_losing', { amount: 5 })
      .notify()
      .send('default');
  }

  @Get('/test')
  async getHello(): Promise<any> {
    const khadamatyServices =
      await this.serviceService.sharedKhadamatyService.Services();
    const khadamatyCataLog =
      await this.serviceService.sharedKhadamatyService.Catalog();
    if (khadamatyServices) {
      this.serviceService.sharedKhadamatyService.updateKhadamatyServices(
        'services',
        khadamatyServices,
      );
    }

    if (khadamatyCataLog) {
      this.serviceService.sharedKhadamatyService.updateKhadamatyServices(
        'catalog',
        khadamatyCataLog,
      );
    }

    return {};
  }
}
