import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AuthHeaders } from './helpers.types';
import {
  ValuEnquiryParams,
  ValuPurchaseParams,
  ValuVerifyCustomerParams,
} from './valu.types';

interface ValueSettings {
  appId: string;
  aggregatorId: string;
  vendorId: string;
  storeId: string;
  valuHeader: string;
}
@Injectable()
export class ValuService {
  private instance: AxiosInstance | null = null;
  private valuValues: ValueSettings;
  constructor(private configService: ConfigService) {
    this.instance = axios.create({
      baseURL: this.configService.get<string>('VALU_BASEURL'),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        // Accept: 'application/json',
      },
    });
    this.valuValues.appId = this.configService.get<string>('VALU_APP_ID');
    this.valuValues.aggregatorId =
      this.configService.get<string>('VALU_AGGREGATOR_ID');
    this.valuValues.vendorId = this.configService.get<string>('VALU_VENDOR_ID');
    this.valuValues.storeId = this.configService.get<string>('VALU_STORE_ID');
    this.valuValues.valuHeader = this.configService.get<string>('VALU_HEADER');
  }
  validateApiKey(apiKey: string): boolean {
    return this.valuValues.valuHeader === apiKey ? true : false;
  }
  private async generateAuthHeaders(): Promise<AuthHeaders> {
    const response = await this.instance.post(
      'Auth/GenerateToken',
      {
        claimsSet: {
          ApplicationId: this.valuValues.appId,
        },
      },
      {
        headers: {
          'x-Gateway-APIKey': this.valuValues.appId,
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
        aggregatorId: this.valuValues.aggregatorId,
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
        aggregatorId: this.valuValues.aggregatorId,
        vendorId: this.valuValues.vendorId,
        storeId: this.valuValues.storeId,
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
        aggregatorId: this.valuValues.aggregatorId,
        vendorId: this.valuValues.vendorId,
        storeId: this.valuValues.storeId,
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
          aggregatorId: this.valuValues.aggregatorId,
          otp: params.otp,
          vendorId: this.valuValues.vendorId,
          vendorName: 'HealthPay',
          storeId: this.valuValues.storeId,
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
