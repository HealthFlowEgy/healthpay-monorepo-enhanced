import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
@Injectable()
export class SmsService {
  instance: AxiosInstance | null = null;
  access_token: string | null = null;
  tClinet: any;
  constructor(private configService: ConfigService) {
    this.instance = axios.create({
      baseURL: this.configService.get<string>('SMS_BASEURL'),
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

  async sendMessage(messageText: string, recipients: string) {
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
      console.log('[sendMessage]', messageText);
    } catch (e) {}

    try {
      this.tClinet = Twilio(
        this.configService.get<string>('TWILIO_SID'),
        this.configService.get<string>('TWILIO_AUTH_TOKEN'),
      );
      console.log('[SMS] Twilio client created');
    } catch (e) {
      console.log('[SMS] Twilio not configured', e);
    }

    if (this.tClinet) {
      this.tClinet.messages
        .create({
          body: messageText,
          to: recipients, // Text this number
          from: this.configService.get<string>('TWILIO_NUMBER'), // From a valid Twilio number
        })
        .then((message) => console.log(message.sid))
        .catch((e) => {
          console.log('[SMS] Twilio failed', e);
        });
    }

    return {};
  }
}
