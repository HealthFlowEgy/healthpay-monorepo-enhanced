import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ValuEnquiryParams } from './helpers.types';
@Injectable()
export class ValuService {
  private instance: AxiosInstance | null = null;
  private accessToken: string | null = null;
  private appId: string = this.configService.get<string>('VALU_APP_ID');
  private aggregatorId: string =
    this.configService.get<string>('VALU_AGGREGATOR_ID');
  private vendorId: string = this.configService.get<string>('VALU_VENDOR_ID');
  private storeId: string = this.configService.get<string>('VALU_STORE_ID');

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
      'Auth/GenerateToken',
      {
        claimsSet: {
          ApplicationId: this.appId,
        },
      },
      {
        headers: {
          'x-Gateway-APIKey': this.appId,
        },
      },
    );
    console.log('[ValuService.generateToken]', response);
    this.accessToken = response.data.accessToken;
    return this.accessToken;
  }
  async enquiry(params: ValuEnquiryParams): Promise<string> {
    if (!this.accessToken) this.generateToken();
    const response = await this.instance.post(
      'ECommerce/Inquiry',
      {
        aggregatorId: this.aggregatorId,
        vendorId: this.vendorId,
        storeId: this.storeId,
        mobileNumber: params.mobileNumber,
        productList: params.productList,
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Transfer-Encoding': 'chunked',
        },
      },
    );
    console.log('[ValuService.enquiry]', response);
    return String(response);
  }
}
