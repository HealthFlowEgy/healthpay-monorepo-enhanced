import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

import { ConfigService } from '@nestjs/config';
import { MessagingContract } from './messaging.contract';
import Twilio from 'twilio';

@Injectable()
export class FirebaseService implements MessagingContract {
  instance: AxiosInstance | null = null;

  access_token: string | null = null;
  tClinet: Twilio.Twilio;
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private configService: ConfigService) {
    this.instance = axios.create({
      baseURL:
        this.configService.get<string>('FCM_BASEURL') ??
        'https://fcm.googleapis.com/fcm',
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization:
          'key=' +
          (this.configService.get<string>('FCM_SERVER_KEY') ??
            'AAAAWy7qAC0:APA91bEPsIb1bzR07OQ1TizJUBtXeO2wD9FCb392pi41ndW1AhVwrHOJ4K1-3SXlHwFUu93EdTL-51GymzboBw-EmsL537gCoYEbRcSd8T7_AetV3HCarYxAQidtqwHBqWM7o6OzDRMQ'),
      },
    });
  }
  sendMessage(
    messageText: string,
    recipients: string[],
    via: string,
    otp: string,
    confirmed?: boolean,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      for (let index = 0; index < recipients.length; index++) {
        const element = recipients[index];

        this.logger.verbose(
          'Sending message to ',
          JSON.stringify({
            notification: {
              title: messageText,
              body: messageText,
              sound: 'default',
            },
            to: element,
          }),
        );

        this.instance
          .post('/send', {
            notification: {
              title: messageText,
              body: messageText,
              sound: 'default',
            },
            to: element,
          })
          .then((response) => {
            this.logger.verbose('Message sent to ' + recipients);
            resolve(true);
          })
          .catch((error) => {
            this.logger.error('Error sending message to ' + recipients);
            this.logger.error(error);
            // reject(false);
          });
      }
    });
  }
}
