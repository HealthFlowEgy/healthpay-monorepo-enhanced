import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ValuEnquiryParams } from './helpers.types';
@Injectable()
export class ValuService {
  private instance: AxiosInstance | null = null;
  constructor(private configService: ConfigService) {
    this.instance = axios.create({
      baseURL: this.configService.get<string>('VALU_BASEURL'),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }
  private generateHMAC(obj: { [key: string]: any }): string {
    obj.hasOwnProperty('hmac') ? delete obj.hmac : obj;
    const object = obj;
    const sortObject = (object) =>
      Object.keys(object)
        .sort((a, b) => {
          if (a.length === b.length) {
            return a.localeCompare(b);
          } else if (a.length >= b.length) {
            return 0;
          } else {
            return -1;
          }
        })
        .reduce((r, k) => ((r[k] = object[k]), r), {});
    const sortedObject = sortObject(object);
    const objectValues = [];
    Object.values(sortedObject).map((el) => {
      if (
        typeof el === 'string' ||
        typeof el === 'number' ||
        typeof el === 'bigint'
      ) {
        objectValues.push(el);
      } else if (Array.isArray(el)) {
        el.map((elArr) => {
          const sortedElArr = sortObject(elArr);
          Object.values(sortedElArr).map((subEl) => {
            if (
              typeof subEl === 'string' ||
              typeof subEl === 'number' ||
              typeof subEl === 'bigint'
            ) {
              objectValues.push(subEl);
            }
          });
        });
      }
    });

    const objectStr = objectValues.join('');
    // return objectStr;
    const hmac = crypto.createHmac(
      'sha512',
      this.configService.get<string>('VALU_SECRET'),
    );
    //passing the data to be hashed
    const data = hmac.update(objectStr);
    //Creating the hmac in the required format
    const gen_hmac = data.digest('hex');
    return gen_hmac;
  }

  async enquiry(
    mobileNumber: string,
    productId: string,
    orderId: string,
  ): Promise<any> {
    const object: ValuEnquiryParams = {
      aggregatorId: this.configService.get<string>('VALU_AGGREGATOR_ID'),
      userName: this.configService.get<string>('VALU_USERNAME'),
      storeId: this.configService.get<string>('VALU_STORE_ID'),
      hmac: '',
      mobileNumber,
      productList: [
        {
          productId,
          productPrice: 1000,
          downPayment: 0,
          discount: 0.0,
          expense: 0.0,
          orderId,
        },
      ],
    };
    const hmac = this.generateHMAC(object);
    object.hmac = hmac;
    console.log(object);
    const response = await this.instance.post('/enquiry/V2', object);
    return response;
  }
}
