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
      },
    });
  }

  private async getAccessToken() {
    const response = await this.instance.post('/login', {
      username: this.configService.get<string>('ONELINK_USERNAME'),
      password: this.configService.get<string>('ONELINK_PASSWORD'),
    });
    this.access_token = response.data.token;
  }

  async createTransaction(
    user: User,
    amount: number,
  ): Promise<OnelinkTransactionResponse> {
    try {
      if (!this.access_token) {
        await this.getAccessToken();
      }
      const data = {
        token: this.access_token,
        first_name: ' ' + user.firstName + ' ',
        last_name: ' ' + user.firstName + user.lastName + ' ',
        mobile: user.mobile.replace('+2', ''),
        email: user.email || 'info@cloudx9.io',
        amount,
      };
      const transactionRes = await this.instance.post(
        '/transaction/create',
        data,
      );
      this.logger.verbose(
        `[createTransaction], ${JSON.stringify(transactionRes.data)}`,
      );
      return transactionRes.data;
    } catch (e) {
      this.logger.verbose(
        `[createTransactionError], ${JSON.stringify(e.response.data || e)}`,
      );
      throw new UnprocessableEntityException('6002', e.response.data);
    }
  }
}
