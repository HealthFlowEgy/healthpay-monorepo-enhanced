import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
@Injectable()
export class SmsService {
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

    this.whatsapp_instance = axios.create({
      baseURL:
        this.configService.get<string>('WA_BASE_URL') ??
        'https://graph.facebook.com/v17.0/183954578141914',
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization:
          'bearer ' + this.configService.get('WA_ACCESS_TOKEN') ??
          'EAAPvbWS11vEBO05fIZAQL5juBD9rGiA8WXALvNEibLJwvwLswWBz32UnZBcSXyVlbwsutsh6jbSIiWVVt2MsIpoZB7T8NTUKfCUbXLlmsITHkwwBMeGOjaCR2ys3Sif5N412odR4ZBm4KihlOPBgikpe3pxdODC7qLOsKFP3S92phsyXgwIuaINpndpirGxgboFx40k1yJYqkw0ai4D5ZAJifZA5yZBzYJKRu3K0wBV7n4ZD',
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
        senderid: 'Health%20Pay',
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
    const response = await this.whatsapp_instance.post('/messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: this.configService.get('WA_TEMPLATE_NAME'),
        language: {
          code: 'en_US',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: otp.replace('-', '').replace('/', ''),
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
                text: otp,
              },
            ],
          },
        ],
      },
    });

    this.logger.verbose('[WHATSAPP_RESPONSE] response', response);

    return response.status === 200;
  }

  async sendMessage(
    messageText: string,
    recipients: string,
    via: string,
    otp: string,
    confirmed?: boolean,
  ) {
    if (via == null || via === 'DEFAULT') {
      this.logger.verbose('[sendMessage] recipients', recipients);
      // if (recipients.startsWith('+2011')) {
      const mobiShastra = await this.mshastra(messageText, recipients);
      this.logger.verbose('[mobiShastra] ' + mobiShastra);
      // } else {
      try {
        const msgObject = {
          senderName: this.configService.get<string>('SMS_SENDERID'),
          messageType: 'text',
          messageText,
          recipients,
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
        // }

        // if (confirmed) {
        //   try {
        //     this.tClinet = Twilio(
        //       this.configService.get<string>('TWILIO_SID'),
        //       this.configService.get<string>('TWILIO_AUTH_TOKEN'),
        //     );
        //     this.tClinet.messages
        //       .create({
        //         body: messageText,
        //         to: recipients, // Text this number
        //         from: this.configService.get<string>('TWILIO_NUMBER'), // From a valid Twilio number
        //       })
        //       .then((message) => this.logger.verbose(message.sid))
        //       .catch((e) => {
        //         this.logger.error(`[Twiliorror] ${JSON.stringify(e)}`);
        //       });
        //   } catch (e) {
        //     this.logger.error(`[Twiliorror] ${JSON.stringify(e)}`);
        //   }
        // }
      }
    } else if (via === 'WHATSAPP') {
      const wa_response = await this.whatsapp(otp, parseInt(recipients));
    }

    return {};
  }
}
