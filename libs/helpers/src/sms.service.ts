import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import { MessagingContract } from './messaging.contract';
@Injectable()
export class SmsService implements MessagingContract {
  instance: AxiosInstance | null = null;
  mobi_instance: AxiosInstance | null = null;
  whatsapp_instance: AxiosInstance | null = null;

  access_token: string | null = null;
  tClinet: Twilio.Twilio;
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {
    this.instance = axios.create({
      baseURL: this.configService.get<string>('SMS_BASEURL'),
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.mobi_instance = axios.create({
      baseURL: this.configService.get<string>('MOBISHASTRA_BASEURL'),
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.logger.verbose(
      '[SMS_BASEURL] ' + this.configService.get<string>('SMS_BASEURL'),
    );
    this.logger.verbose(
      '[WA_BASE_URL] Bearer ' +
        this.configService.get<string>('WA_ACCESS_TOKEN'),
    );

    this.whatsapp_instance = axios.create({
      baseURL: 'https://graph.facebook.com',
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.configService.get('WA_ACCESS_TOKEN'),
      },
    });
  }

  async getAccessToken() {
    const response = await this.instance.post('/signin', {
      apiKey: this.configService.get<string>('SMS_APIKEY'),
      userName: this.configService.get<string>('SMS_APIUSER'),
    });
    this.logger.verbose('[getAccessToken] response', JSON.stringify(response));
    this.access_token = response.data.data.access_token;
  }

  async mshastra(messageText: string, mobileno: string): Promise<boolean> {
    const response = await this.mobi_instance.get('', {
      params: {
        user: 'HealthPay',
        pwd: '91ujmb_e',
        // senderid: 'Health%20Pay',
        senderid: 'HealthPay',
        mobileno: mobileno,
        msgtext: messageText,
        priority: 'High',
        CountryCode: 'ALL',
      },
    });
    this.logger.verbose(
      '[mobiShastra] response',
      JSON.stringify(response.data),
    );
    if (response.data != null) {
      return true;
    }
  }

  async whatsapp(otp: string, recipient: number): Promise<boolean> {
    try {
      const response = await this.whatsapp_instance.post(
        this.configService.get('WA_POST_URL'),
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'template',
          template: {
            name: 'healthpay',
            language: {
              code: 'ar',
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: otp.replace(/[^a-zA-Z0-9 ]/g, '').replace('/', ''),
                  },
                ],
              },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [
                  {
                    type: 'text',
                    text: otp.replace(/[^a-zA-Z0-9 ]/g, '').replace('/', ''),
                  },
                ],
              },
            ],
          },
        },
      );

      this.logger.verbose('[WHATSAPP_RESPONSE] response', response.data);

      return response.status === 200;
    } catch (e) {
      this.logger.error('[WHATSAPP_RESPONSE] error', {
        e: e,
        error: e.response.data,
        whatsapp_instance: this.whatsapp_instance,
      });
    }
  }

  async sendMessage(
    messageText: string,
    recipients: string | string[],
    via: string,
    otp: string,
    confirmed?: boolean,
  ): Promise<boolean> {
    this.logger.verbose(
      '[sendMessage] messageText',
      messageText,
      'recipients',
      recipients,
      'via',
      via,
      'otp',
      otp,
      'confirmed',
      confirmed,
    );

    if (via == null || via === 'DEFAULT') {
      this.logger.verbose('[sendMessage] recipients', recipients);
      recipients = typeof recipients === 'string' ? recipients : recipients[0];
      const mobiShastra = await this.mshastra(messageText, recipients);
      this.logger.verbose('[mobiShastra] ' + mobiShastra);

      try {
        const msgObject = {
          senderName: this.configService.get<string>('SMS_SENDERID'),
          messageType: 'text',
          messageText,
          recipients: Array.isArray(recipients)
            ? recipients.join(',')
            : recipients,
        };
        if (!this.access_token) {
          await this.getAccessToken();
        }

        const messageResponse = await this.instance.post(
          '/messaging?access_token=' + this.access_token,
          msgObject,
        );
        this.logger.verbose(`[sendMessage]  ${messageText}`);
      } catch (e) {
        this.logger.error({
          message: `[sendMessage] ${JSON.stringify(e)}`,
          error: e,
        });
      }
    } else if (via === 'WHATSAPP') {
      recipients = typeof recipients === 'string' ? recipients : recipients[0];
      const wa_response = await this.whatsapp(otp, parseInt(recipients));
    }

    return true;
  }
}
