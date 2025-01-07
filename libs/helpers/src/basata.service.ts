import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

import { ConfigService } from '@nestjs/config';

export type BasataResponse<T> = {
  success: boolean;
  language?: string;
  action?: string;
  version?: number;
  error_text?: string;
  error_code?: string;
  data?: T | null;
};
export type IBasataProvider = {
  id: number;
  name: string;
  name_ar: string;
};

export type IBasataProvidersList = {
  provider_list: IBasataProvider[];
  service_version: number;
};

export type IBasataCategories = {
  category_list: {
    id: number;
    name: string;
    name_ar: string;
  }[];
};

export type IBasataService = {
  id: number;
  provider_id: number;
  name: string;
  name_ar: string;
  price_type: string;
  service_value: number;
  min_quantity: number;
  max_quantity: number;

  min_value: number;
  max_value: number;

  sort_order: number;
  inquiry_required: boolean;
  service_charge_list: Array<{
    from: number;
    to: number;
    charge: number;
    slap: number;
    percentage: boolean;
  }>;
};

export type IBasataServices = {
  service_list: Array<IBasataService>;
};

export type IBasataServiceInputParams = {
  input_parameter_list: Array<{
    service_id: number;
    key: string;
    name: string;
    name_ar: string;
    position: number;
    visible: boolean;
    required: boolean;
    parameter_type: string;
    client_id: boolean;
    default_value: string;
    min_length: number;
    max_length: number;
    confirm_required: boolean;
  }>;
};

export type IBasataTransactionInquiry = {
  transaction_id: string;
  status: string;
  status_text: string;
  date_time: string;
  info_text: string;
  amount: number;
  min_amount: number;
  max_amount: number;
};

export type IBasataTransactionDetailsObj = {
  provider_name: string;
  service_name: string;
  customer_number: string;
  amount: number;
  total_amount: number;
  date_time: string;
  status: string;
  status_text: string;
  error_text: string;
  provider_response_code: string;
  details_list: Array<
    Array<{
      key: string;
      value: string;
    }>
  >;
};

export type IBasataTransactionDetails = {
  transaction_details: IBasataTransactionDetailsObj;
};

export type IBasataTransactionPayment = {
  transaction_id: string;
  status: string;
  status_text: string;
  date_time: string;
  service: IBasataService;
  provider: IBasataProvider;
  amount: number;
  serviceCharge: number;
  userAmount: number;

  details_list: Array<Array<{ key: string; value: string }>>;
};

@Injectable()
export class BasataService {
  private readonly logger = new Logger(BasataService.name);

  instance: AxiosInstance | null = null;
  configs: any;

  constructor(private configService: ConfigService) {
    this.configs = {
      baseURL:
        this.configService.get<string>('BASATA_BASEURL') ??
        'https://nx-staging.bee.com.eg:6443/restgw/api',
      timeout: 505000,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Accept: 'application/json',
      },
    };
    this.instance = axios.create(this.configs);

    this.instance.interceptors.request.use((request) => {
      // this.logger.verbose(`[basata_api_requests] ${JSON.stringify(request)}`);
      return request;
    });

    this.instance.interceptors.response.use((response) => {
      return response;
    });
  }

  async getProviderList(): Promise<BasataResponse<any>> {
    return this._getResults('GetProviderList', {});
  }

  async getCategoryList(): Promise<BasataResponse<IBasataCategories>> {
    return this._getResults('GetCategoryList', {});
  }

  async getServiceList(): Promise<BasataResponse<IBasataServices>> {
    return this._getResults('GetServiceList', {});
  }

  async getByActionName<T>(
    action: string,
    params: any,
    endpoint = '/service',
  ): Promise<BasataResponse<T>> {
    return this._getResults<T>(action, params, endpoint);
  }

  /**
   * @param action
   * @param params
   * @returns Basata response
   */
  private async _getResults<T>(
    action: string,
    params: any,
    endpoint = '/service',
  ): Promise<BasataResponse<T>> {
    try {
      const apiResponse = await this.instance?.post(
        endpoint,
        this._buildParams(action, params),
      );

      // this.logger.verbose(
      //   '[basata_api_responses] ' + JSON.stringify(apiResponse?.data),
      // );

      return this._handleResponse(apiResponse);
    } catch (e) {
      return {
        success: false,
        error_code: '7900' + (e.response?.data?.error_code ?? '00'),
        error_text:
          e.response?.data?.error_text ?? 'Bill payment service failed',
        data: null,
      };
    }
  }

  /**
   * @param action
   * @param params
   * @returns Basata params object
   */
  private _buildParams(action: string, params: any): Record<string, any> {
    return {
      login: this.configService.get<string>('BASATA_LOGIN') ?? '4600631438',
      password:
        this.configService.get<string>('BASATA_PASSWORD') ?? 'welcome123',
      terminal_id:
        this.configService.get<string>('BASATA_TERMINAL_ID') ?? '1234567890',

      language: 'en',
      action,
      version: 2,
      data: params ?? {},
    };
  }

  private _handleResponse<T>(
    response: AxiosResponse<BasataResponse<T>>,
  ): BasataResponse<T> {
    // this.logger.verbose(
    //   '[basata_api_responses] ' + JSON.stringify(response?.data),
    // );

    if (response.data.success) {
      return response.data;
    }

    throw new BadRequestException('7900', 'Bill payment service failed');
  }
}
