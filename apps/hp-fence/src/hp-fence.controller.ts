import { Controller, Get } from '@nestjs/common';
import { HpFenceService } from './hp-fence.service';

@Controller()
export class HpFenceController {
  constructor(private readonly hpFenceService: HpFenceService) {}

  @Get('/hello')
  async hello() {
    return await this.hpFenceService.getHello();
  }
}
