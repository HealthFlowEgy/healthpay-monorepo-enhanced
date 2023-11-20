import { Controller, Get, Inject } from '@nestjs/common';
import { HpFenceService } from './hp-fence.service';
import { ServicesService } from '@app/services';

@Controller()
export class HpFenceController {
  constructor(
    private readonly hpFenceService: HpFenceService,
    @Inject(ServicesService)
    private serviceService: ServicesService,
  ) {}

  // @Get('/test')
  // async getHello(): Promise<any> {
  //   return this.serviceService.sharedKhadamatyService.getKhadamatyServices(
  //     'catalog',
  //   );
  // }
}
