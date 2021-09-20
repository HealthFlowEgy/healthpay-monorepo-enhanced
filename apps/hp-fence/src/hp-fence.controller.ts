import { Controller, Get } from '@nestjs/common';
import { HpFenceService } from './hp-fence.service';

@Controller()
export class HpFenceController {
  constructor(private readonly hpFenceService: HpFenceService) {}

  @Get()
  getHello(): string {
    return this.hpFenceService.getHello();
  }
}
