import { ValuService } from '@app/helpers';
import {
  ValuEnquiryParams,
  ValuPurchaseParams,
  ValuVerifyCustomerParams,
} from '@app/helpers/helpers.types';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class HpFenceService {
  constructor(@Inject(ValuService) private valuService: ValuService) {}
  async valu(): Promise<any> {
    const enquiryParams: ValuEnquiryParams = {
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
    };

    const verifyParams: ValuVerifyCustomerParams = {
      mobileNumber: '00009981337',
      orderId: '8232569b800742fa8d01410e7ac79b45',
    };

    const purchaseParams: ValuPurchaseParams = {
      otp: '123456',
      mobileNumber: '00009981337',
      productList: [
        {
          productId: 'EGMHOC23DP5',
          productPrice: 500,
          orderId: '8232569b800742fa8d01410e7ac79b45',
          downPayment: 0,
          ToUAmount: 0,
          CashbackAmount: 0,
          tenure: 9,
        },
      ],
    };

    return {
      customerStatusRes: await this.valuService.customerStatus('00009981337'),
      enquiry: await this.valuService.enquiry(enquiryParams),
      verifyCustomer: await this.valuService.verifyCustomer(verifyParams),
      purchase: await this.valuService.purchase(purchaseParams),
    };
  }
}
