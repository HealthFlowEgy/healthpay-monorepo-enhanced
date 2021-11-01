import { ValuService } from '@app/helpers';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class HpFenceService {
  constructor(@Inject(ValuService) private valuService: ValuService) {}
  getHello() {
    // const enquiryParams: ValuEnquiryParams = {
    //   mobileNumber: '00009981337',
    //   productList: [
    //     {
    //       productId: 'EGMHOC23DP5',
    //       productPrice: 500,
    //       orderId: '8232569b800742fa8d01410e7ac79b45',
    //       downPayment: 0,
    //       ToUAmount: 0,
    //       CashbackAmount: 0,
    //     },
    //   ],
    // };
    // return this.valuService.enquiry(enquiryParams);
    return this.valuService.generateToken();
  }
}
