import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
@Injectable()
export class SmsService {
  instance: AxiosInstance | null = null;
  mobi_instance: AxiosInstance | null = null;

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
  }

  async getAccessToken() {
    const response = await this.instance.post('/signin', {
      apiKey: this.configService.get<string>('SMS_APIKEY'),
      userName: this.configService.get<string>('SMS_APIUSER'),
    });
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

  async sendMessage(
    messageText: string,
    recipients: string,
    confirmed?: boolean,
  ) {
    this.logger.verbose('[sendMessage] recipients', recipients);
    if (recipients.startsWith('+2011')) {
      const mobiShastra = await this.mshastra(messageText, recipients);
      this.logger.verbose('[mobiShastra] ' + mobiShastra);
    } else {
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
      }

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

    return {};
  }
}
