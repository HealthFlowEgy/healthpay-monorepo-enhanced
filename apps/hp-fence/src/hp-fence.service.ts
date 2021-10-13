import { ValuService } from '@app/helpers';
import { Inject, Injectable } from '@nestjs/common';
import crypto from 'crypto';

@Injectable()
export class HpFenceService {
  constructor(@Inject(ValuService) private valu: ValuService) {}
  async getHello() {
    await this.valu.enquiry('01008606003', 'EHONYPC23DP0', '788772322659n59');
    // const object = {
    //   aggregatorId: 'PayTabs',
    //   userName: 'VDR2301201057',
    //   storeId: '44615',
    //   mobileNumber: '01008606003',
    //   productList: [
    //     {
    //       productId: 'EHONYPC23DP0',
    //       productPrice: 1000,
    //       downPayment: 0,
    //       discount: 0.0,
    //       expense: 0.0,
    //       orderId: '788772322659n59',
    //     },
    //   ],
    // };
    // const sortObject = (object) =>
    //   Object.keys(object)
    //     .sort((a, b) => {
    //       if (a.length === b.length) {
    //         return a.localeCompare(b);
    //       } else if (a.length >= b.length) {
    //         return 0;
    //       } else {
    //         return -1;
    //       }
    //     })
    //     .reduce((r, k) => ((r[k] = object[k]), r), {});
    // const sortedObject = sortObject(object);
    // const objectValues = [];
    // Object.values(sortedObject).map((el) => {
    //   if (
    //     typeof el === 'string' ||
    //     typeof el === 'number' ||
    //     typeof el === 'bigint'
    //   ) {
    //     objectValues.push(el);
    //   } else if (Array.isArray(el)) {
    //     el.map((elarr) => {
    //       const sortedelArr = sortObject(elarr);
    //       Object.values(sortedelArr).map((subEl) => {
    //         console.log('[sortedelArr:map]', subEl);
    //         if (
    //           typeof subEl === 'string' ||
    //           typeof subEl === 'number' ||
    //           typeof subEl === 'bigint'
    //         ) {
    //           objectValues.push(subEl);
    //         }
    //       });
    //     });
    //   }
    // });

    // const objectStr = objectValues.join('');
    // // return objectStr;
    // const hmac = crypto.createHmac(
    //   'sha512',
    //   'HV1SNMLLH4J53W7IONOLBKVP6ECMDYXU',
    // );
    // //passing the data to be hashed
    // const data = hmac.update(objectStr);
    // //Creating the hmac in the required format
    // const gen_hmac = data.digest('hex');
    // return gen_hmac;
  }
}
