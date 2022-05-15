import { Controller, Get } from '@nestjs/common';
import { HpFinancingService } from './hp-financing.service';

@Controller()
export class HpFinancingController {
  constructor(private readonly hpFinancingService: HpFinancingService) {}

  @Get()
  getHello(): string {
    return this.hpFinancingService.getHello();
  }
}
