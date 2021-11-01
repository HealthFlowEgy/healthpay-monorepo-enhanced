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
    const access_token = await this.generateToken();
    const token = 'Bearer ' + access_token;
    const response = await this.instance.post(
      'ECommerce/Inquiry',
      {
        aggregatorId: this.configService.get<string>('VALU_AGGREGATOR_ID'),
        vendorId: this.configService.get<string>('VALU_VENDOR_ID'),
        storeId: this.configService.get<string>('VALU_STORE_ID'),
        mobileNumber: params.mobileNumber,
        productList: [
          {
            productId: 'EGMHOC23DP5',
            productPrice: 500,
            orderId: '8232569b800742fa8d01410e7ac79b45',
            downPayment: 0,
            ToUAmount: 0,
            CashbackAmount: 0,
          },
        ],
      },
      {
        headers: {
          Authorization: token,
        },
      },
    );
    console.log('[ValuService.enquiry]', response.data);
    return String(response.data);
  }
}
