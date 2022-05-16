import { Module } from '@nestjs/common';
import { AuthFinanceService } from './auth-finance.service';

@Module({
  providers: [AuthFinanceService]
})
export class AuthFinanceModule {}
