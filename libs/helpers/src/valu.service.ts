import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
@Injectable()
export class ValuService {
  private instance: AxiosInstance | null = null;
  private accessToken: string | null = null;
  constructor(private configService: ConfigService) {
    this.instance = axios.create({
      baseURL: this.configService.get<string>('VALU_BASEURL'),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        // Accept: 'application/json',
      },
    });
  }
  async generateToken(): Promise<string> {
    const response = await this.instance.post(
      '/Auth/GenerateToken',
      {
        claimsSet: {
          ApplicationId: this.configService.get<string>('VALU_APP_ID'),
        },
      },
      {
        headers: {
          'x-Gateway-APIKey': this.configService.get<string>('VALU_APP_ID'),
        },
      },
    );
    console.log('[ValuService.generateToken]', response);
    this.accessToken = response.data.accessToken;
    return this.accessToken;
  }
}
