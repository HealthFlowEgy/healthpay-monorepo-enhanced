import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HelpersService } from './helpers.service';
import { SmsService } from './sms.service';
import { OnelinkService } from './onelink.service';
import { NestjsGraphqlValidator } from './nestjs-graphql-validator.pipe';
import { FirebaseService } from './firebase.service';

@Module({
  imports: [ConfigModule],
  providers: [HelpersService, SmsService, OnelinkService, FirebaseService],
  exports: [HelpersService, SmsService, OnelinkService, FirebaseService],
})
export class HelpersModule {}
