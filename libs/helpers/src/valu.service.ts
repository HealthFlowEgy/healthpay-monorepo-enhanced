import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AuthHeaders } from './helpers.types';
import {
  ValuEnquiryParams,
  ValuPurchaseParams,
  ValuVerifyCustomerParams,
} from './valu.types';
@Injectable()
export class ValuService {
  private instance: AxiosInstance | null = null;
  private appId: string = this.configService.get<string>('VALU_APP_ID');
  private aggregatorId: string =
    this.configService.get<string>('VALU_AGGREGATOR_ID');
  private vendorId: string = this.configService.get<string>('VALU_VENDOR_ID');
  private storeId: string = this.configService.get<string>('VALU_STORE_ID');
  private valuHeader: string = this.configService.get<string>('VALU_HEADER');
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
  validateApiKey(apiKey: string): boolean {
    return this.valuHeader === apiKey ? true : false;
  }
  private async generateAuthHeaders(): Promise<AuthHeaders> {
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
    return {
      Authorization: 'Bearer ' + response.data.accessToken,
    };
  }
  async customerStatus(mobile: string): Promise<any> {
    const authHeaders = await this.generateAuthHeaders();
    const response = await this.instance.post(
      'Customer/getCustomerStatus',
      {
        aggregatorId: this.aggregatorId,
        mobileNumber: mobile,
      },
      {
        headers: authHeaders,
      },
    );
    console.log('[ValuService.customerStatus]', response.data);
    return response.data;
  }
  async enquiry(params: ValuEnquiryParams): Promise<any> {
    const authHeaders = await this.generateAuthHeaders();
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
        headers: authHeaders,
      },
    );
    console.log(
      '[ValuService.enquiry]',
      response.data.productList[0].tenureList,
    );
    return response.data;
  }

  async verifyCustomer(params: ValuVerifyCustomerParams): Promise<any> {
    const authHeaders = await this.generateAuthHeaders();
    const response = await this.instance.post(
      'Customer/verifyCustomer',
      {
        aggregatorId: this.aggregatorId,
        vendorId: this.vendorId,
        storeId: this.storeId,
        mobileNumber: params.mobileNumber,
        orderId: params.orderId,
      },
      {
        headers: authHeaders,
      },
    );
    console.log('[ValuService.verifyCustomer]', response.data);
    return response.data;
  }

  async purchase(params: ValuPurchaseParams): Promise<any> {
    const authHeaders = await this.generateAuthHeaders();
    const response = this.instance
      .post(
        'ECommerce/Purchase',
        {
          aggregatorId: this.aggregatorId,
          otp: params.otp,
          vendorId: this.vendorId,
          storeId: this.storeId,
          mobileNumber: params.mobileNumber,
          productList: params.productList,
        },
        {
          headers: authHeaders,
        },
      )
      .then((res) => console.log('[ValuService.purchase]', res))
      .catch((err) => console.log('ERR', err));

    return response;
  }
}
