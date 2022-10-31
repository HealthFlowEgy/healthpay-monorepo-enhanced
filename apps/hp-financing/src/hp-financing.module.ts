import { Module } from '@nestjs/common';
import { HpFinancingController } from './hp-financing.controller';
import { HpFinancingService } from './hp-financing.service';

@Module({
  imports: [],
  controllers: [HpFinancingController],
  providers: [HpFinancingService],
})
export class HpFinancingModule {}
