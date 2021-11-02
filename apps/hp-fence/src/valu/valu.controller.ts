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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('valu')
export class ValuController {
  constructor(
    @Inject(ValuService) private valuService: ValuService,
    @Inject(ConfigService) private configService: ConfigService,
  ) {}
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
  @Post('/customerStatus/:id')
  async customerStatus(
    @Param('id') id: string,
    @Body('mobileNumber') mobileNumber: string,
    @Headers('x-api-key') apiKey: string,
  ): Promise<any> {
    if (!this.valuService.validateHeaders(apiKey))
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    return await this.valuService.customerStatus(mobileNumber);
  }
}
