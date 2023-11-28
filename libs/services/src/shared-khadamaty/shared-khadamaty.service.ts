import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { SharedBalanceService } from '../shared-balance/shared-balance.service';
import { SharedNotifyService } from '../shared-notify/shared-notify.service';

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { UserPayoutServiceRequest } from '@prisma/client';
import { KhadamatyServicePaymentRequest } from './khadamaty-service-request';
import moment from 'moment';

@Injectable()
export class SharedKhadamatyService {
  private readonly logger = new Logger(SharedKhadamatyService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(SharedNotifyService) private sharedNotify: SharedNotifyService,
    @Inject(forwardRef(() => SharedBalanceService))
    private sharedBalance: SharedBalanceService,
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  private getConfigValue(key: string): string {
    return this.configService.get<string>(key);
  }

  private getAuthObject(): any {
    return {
      Auth: {
        UserId: this.getConfigValue('KHADAMATY_USERID'),
        Password: this.getConfigValue('KHADAMATY_PASSWORD'),
        AgentCode: this.getConfigValue('KHADAMATY_AGENTCODE'),
        Device: '71',
        AppId: this.getConfigValue('KHADAMATY_APPID'),
      },
    };
  }

  private getKHadamatyUrl(endpoint: string): string {
    return this.getConfigValue('KHADAMATY_BASEURL') + '/' + endpoint;
  }

  private async khadamatyHttpRequest(
    endpoint: string,
    data: any,
    debug = true,
  ): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.httpService.axiosRef.post(
        this.getKHadamatyUrl(endpoint),
        {
          ...this.getAuthObject(),
          ...data,
        },
      );
      debug &&
        this.logger.debug('[khadamatyHttpRequest] response', {
          response: response.data,
        });
      return response.data;
    } catch (e) {
      debug &&
        this.logger.error(
          '[khadamatyHttpRequest] error',
          JSON.stringify({
            error: e,
            data,
            endpoint,
          }),
        );
      return null;
    }
  }

  public async Services(): Promise<any[]> {
    const response = await this.khadamatyHttpRequest('Services', {
      Version: 0,
    });

    if (response && response.length > 0) {
      return response;
    }

    return [];
  }

  public async Inquiry(service: any, body: any): Promise<any> {
    const inquryBody = {
      ServiceId: service.ServiceId,
      InqFields: this.parseBodyInqFields(body),
    };

    const response = await this.khadamatyHttpRequest('Inquiry', inquryBody);

    if (response && response.ServiceId > 0) {
      return response;
    }

    return {};
  }

  public async Payment(
    paymentServiceRequest: UserPayoutServiceRequest,
  ): Promise<any> {
    const requestDetails: KhadamatyServicePaymentRequest = JSON.parse(
      paymentServiceRequest.fields.toString(),
    );

    const paymentBody = {
      ServiceId: paymentServiceRequest.serviceId,
      SenderTrans: paymentServiceRequest.uid,
      ServiceCount: 0,
      Amount: requestDetails.amount,
      Fees: 0.0,
      Fields: requestDetails.serviceFields,
    };

    const response = await this.khadamatyHttpRequest('Payment', paymentBody);

    if (response && response.StatusCode == 1) {
      return response;
    }

    return {};
  }

  public async CalculateFees(service: any, body: any): Promise<any> {
    const calcFeesBody = {
      ServiceId: service.ServiceId,
      Amount: this.getFieldValuesTypeAmount(service, body).reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        service.Price,
      ),
    };
    console.log('calcFeesBody', calcFeesBody);

    const response = await this.khadamatyHttpRequest(
      'CalculateFees',
      calcFeesBody,
    );

    if (response && response.ServiceId > 0) {
      return response;
    }

    return {};
  }

  parseBodyInqFields(body: any): any[] {
    const inqFields: any[] = [];
    Object.keys(body).forEach((key) => {
      inqFields.push({
        SFId: key,
        Value: this.getFieldValue(body[key]),
      });
    });

    return inqFields;
  }

  getFieldValuesTypeAmount(service: any, body: any): any[] {
    return this.fillFieldValues(service, body)
      .filter((el) => el.FieldName === 'Amount')
      .map((el) => el.Value);
  }

  fillFieldValues(service: any, body: any): any[] {
    const filledFields = [];
    if (!service.ServiceFields || service.ServiceFields.length <= 0)
      return filledFields;

    for (let index = 0; index < service.ServiceFields?.length; index++) {
      const sField = service.ServiceFields[index];
      filledFields.push({
        ...sField,
        Value: body[sField.SFId],
      });
    }

    return filledFields;
  }

  isNumber(value?: string | number): boolean {
    return value != null && value !== '' && !isNaN(Number(value.toString()));
  }

  getFieldValue(field: any): any {
    if (this.isNumber(field)) {
      return parseFloat(field).toFixed(2);
    }

    return field;
  }

  public parseBodyObject(body) {
    const fields = {};
    Object.keys(body).forEach((key) => {
      const parsedKey = key
        .replace('[]', '')
        .replace('"', '')
        .replace("''", '')
        .replace(/\D/g, '');
      fields[parsedKey] = body[key];
    });
    return fields;
  }

  public async Catalog(): Promise<any> {
    const response = await this.khadamatyHttpRequest('Catalog', {
      Version: 0,
    });
    if (response && response.StatusCode == 1 && response.Catalog != null) {
      return response.Catalog;
    }

    return {};
  }

  public async updateKhadamatyServices(key: string, value: any) {
    return this.prisma.khadamatyServices.upsert({
      where: {
        name: key,
      },
      update: {
        data: value,
      },
      create: {
        name: key,
        data: value,
      },
    });
  }

  public async getKhadamatyServices(key: string): Promise<any> {
    return this.prisma.khadamatyServices.findFirst({
      where: {
        name: key,
      },
    });
  }

  public async getCategoryById(id: any): Promise<any> {
    return (await this.getKhadamatyServices('catalog')).data.Categories.find(
      (el: any) => el.CategoryId === parseInt(`${id}`),
    );
  }

  public async getServiceById(id: any): Promise<any> {
    return (await this.getKhadamatyServices('catalog')).data.Services.find(
      (el: any) => el.ServiceId === parseInt(`${id}`),
    );
  }

  public async createUserPayoutServiceRequest(
    request: KhadamatyServicePaymentRequest,
  ): Promise<UserPayoutServiceRequest> {
    return this.prisma.userPayoutServiceRequest.create({
      data: {
        serviceId: request.serviceId,
        fields: JSON.stringify(request),
        status: 'PENDING',
        userId: null,
        uid: this.helpers.doCreateUUID('KhadamatyServiceRequest'),
      },
    });
  }

  public async getUserPayoutServiceRequest(
    requestId: string,
  ): Promise<UserPayoutServiceRequest> {
    return this.prisma.userPayoutServiceRequest.findFirst({
      where: {
        uid: requestId,
      },
    });
  }

  public async getDepericatedServiceRequests(): Promise<
    UserPayoutServiceRequest[]
  > {
    return this.prisma.userPayoutServiceRequest.findMany({
      where: {
        updatedAt: {
          lt: moment().subtract(1, 'week').toISOString(),
        },
      },
    });
  }

  public async deleteUserPayoutServiceRequest(
    serviceRequest: UserPayoutServiceRequest,
  ) {
    return this.prisma.userPayoutServiceRequest.delete({
      where: {
        uid: serviceRequest.uid,
      },
    });
  }

  public async updateUserPayoutServiceRequest(requestId: string, data: any) {
    return this.prisma.userPayoutServiceRequest.update({
      where: {
        uid: requestId,
      },
      data,
    });
  }
}
