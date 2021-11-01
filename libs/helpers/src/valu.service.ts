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
    // console.log('[ValuService.generateToken]', response);
    this.accessToken = response.data.accessToken;
    return this.accessToken;
  }
  async enquiry(params: ValuEnquiryParams): Promise<string> {
    // this.generateToken();
    // const token = 'Bearer ' + this.accessToken;
    try {
      const response = this.instance
        .post(
          'ECommerce/Inquiry',
          {
            aggregatorId: 'Jumia',
            vendorId: 'VDR2610212937',
            storeId: '121311661',
            mobileNumber: '00009981337',
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
              Authorization:
                'Bearer eyJraWQiOiJzc29zIiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJlYmFjMTNiZi1iYjQ0LTQ1MTEtYjYzMi1jZWY2YzI0ODNkMDciLCJhdWQiOiJlYmFjMTNiZi1iYjQ0LTQ1MTEtYjYzMi1jZWY2YzI0ODNkMDciLCJpc3MiOiJBUElHV1Rva2VuSXNzdWVyIiwiQXBwbGljYXRpb25JZCI6IjYzZDU3NDhjLWNiNDEtNDBiMS1iMmI4LWE2MTg4ZTA5ZmExNyIsImV4cCI6MTYzNTc3MTA4NSwiaWF0IjoxNjM1NzcwMTg1fQ.OwdL6-DwtBt6QV67xj4Pufrwo1frTYCPx5h9Ciy-EWMmV8LFAOrjdRE5fgTPkDbmgo8Q0XHix7EoUx0gIMUXO1_lQ-yCPFMCLKcvLmKbHzlbKL9MCxGIgUGnyxuo_6aMQWWBux2FHiBXKABOaB3VZFOy8p-i89EIBJW-11RO0WRuQoLZZBDm5KjCF4xxrQctIb2Xsek7KVzAPsIDNaL60xhq-QhCKsX5MsFMpfRm22un99xh84c1JykooiWPw5efuQfbDgVP8QIzAzahuur65pPX-i3QoaRyo_XMxGwhShsx7ICSA1vMg6a-ZF8zoznDuWJUhRb5ribFtj45T0NblA',
            },
          },
        )
        .then((res) => console.log('RESULT', res.data))
        .catch((err) => console.log('ERROR', err));
      // console.log('[ValuService.enquiry]', response.data);
      return String('');
    } catch (e) {
      return String(e.message + ' ' + e.code);
    }
  }
}
