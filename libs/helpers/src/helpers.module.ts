import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HelpersService } from './helpers.service';
import { SmsService } from './sms.service';
import { OnelinkService } from './onelink.service';
import { ValuService } from './valu.service';

@Module({
  imports: [ConfigModule],
  providers: [HelpersService, SmsService, OnelinkService, ValuService],
  exports: [HelpersService, SmsService, OnelinkService, ValuService],
})
export class HelpersModule {}
