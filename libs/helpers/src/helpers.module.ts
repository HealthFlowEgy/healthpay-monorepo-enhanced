import { BasataService } from './basata.service';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from './firebase.service';
import { HelpersService } from './helpers.service';
import { Module } from '@nestjs/common';
import { NestjsGraphqlValidator } from './nestjs-graphql-validator.pipe';
import { OnelinkService } from './onelink.service';
import { SmsService } from './sms.service';

@Module({
  imports: [ConfigModule],
  providers: [
    HelpersService,
    SmsService,
    OnelinkService,
    FirebaseService,
    BasataService,
  ],
  exports: [
    HelpersService,
    SmsService,
    OnelinkService,
    FirebaseService,
    BasataService,
  ],
})
export class HelpersModule {}
