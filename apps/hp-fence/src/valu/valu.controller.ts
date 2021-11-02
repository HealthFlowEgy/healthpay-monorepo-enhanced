import { ValuService } from '@app/helpers/valu.service';
import { ValuEnquiryParams } from '@app/helpers/valu.types';
import {
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Param,
  Post,
  Headers,
} from '@nestjs/common';

@Controller('valu')
export class ValuController {
  constructor(@Inject(ValuService) private valuService: ValuService) {}
  @Get('/enquiry')
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
    return { data: [] };
    return await this.valuService.enquiry(enquiryParams);
  }

  // @Get('/customerStatus/:id')
  // async customerStatus(@Param('id') id: string) {
  //   return { id: id };
  //   // await this.valuService.customerStatus('00009981337');
  // }
  @Post('/customerStatus/:id')
  @Header('x-api-key', '835679saw-pw89-w2c0-aw84615e09tw24')
  async customerStatus(
    @Param('id') id: string,
    @Body('mobileNumber') mobileNumber: string,
    @Headers('x-api-key') apiKey: string,
  ): Promise<any> {
    return {
      apiKey: apiKey,
      customerStatus: await this.valuService.customerStatus('00009981337'),
    };
  }
}
