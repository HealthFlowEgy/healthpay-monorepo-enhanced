import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { OnelinkTransactionResponse } from './helpers.types';

@Injectable()
export class OnelinkService {
  private instance: AxiosInstance | null = null;
  private access_token: string | null = null;
  private readonly logger = new Logger(OnelinkService.name);

  constructor(private configService: ConfigService) {
    this.instance = axios.create({
      baseURL: this.configService.get<string>('ONELINK_BASEURL'),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-api-key': '32b5f364-4f0f-45bd-965c-0830f7dc24f3',
      },
    });
  }

  private async getAccessToken() {
    const response = await this.instance.post('/auth/login', {
      api_key: '8301df53-4ca9-465b-9878-a134c4a17942',
      api_secret: '28cb42c5-01d9-4c09-98f8-e1e276497a52',
    });
    console.log(response.data);
    this.access_token = response.data.token;
  }

  async createTransaction(user: User, amount: number): Promise<any> {
    try {
      if (!this.access_token) {
        await this.getAccessToken();
      }

      const data = {
        first_name: ' ' + user.firstName + ' ',
        last_name: user.lastName ?? ' ',
        mobile: user.mobile.replace('+2', ''),
        email: user.email || 'info@cloudx9.io',
        amount,
      };
      const transactionRes = await this.instance.post(
        '/transaction/create',
        data,
        {
          headers: {
            Authorization: `Bearer ${this.access_token}`,
          },
        },
      );

      this.logger.verbose(
        `[createTransaction], ${JSON.stringify(transactionRes.data)}`,
      );
      // return transactionRes.data;
      this.logger.verbose(transactionRes.data.uid);
      return {
        transaction_id: transactionRes.data.uid,
        iframe: transactionRes.data.iframe_url,
      };
    } catch (e) {
      this.logger.verbose(
        `[createTransactionError], ${JSON.stringify(e.response.data || e)}`,
      );
      throw new UnprocessableEntityException('6002', e.response.data);
    }
  }
}
