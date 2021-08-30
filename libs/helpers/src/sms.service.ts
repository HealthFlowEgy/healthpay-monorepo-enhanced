import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  instance: AxiosInstance | null = null;
  access_token: string | null = null;

  constructor(private configService: ConfigService) {
    this.instance = axios.create({
      baseURL: this.configService.get<string>('SMS_BASEURL'),
      timeout: 10000,
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
    return messageResponse.data;
  }
}
