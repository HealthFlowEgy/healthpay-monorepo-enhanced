import { HelpersService } from '@app/helpers';
import { ValuService } from '@app/helpers/valu.service';
import { ValuEnquiryParams } from '@app/helpers/valu.types';
import { ServicesService } from '@app/services';
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
    @Inject(ServicesService) private services: ServicesService,
    @Inject(ValuService) private valuService: ValuService,
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(HelpersService) private helpers: HelpersService,
  ) {}
  @Get('/hmac')
  async hmac(): Promise<any> {
    return await this.services.sharedUser.createValuHmac(3);
  }

  @Post('/customerStatus/:id')
  async customerStatus(
    @Param('id') id: string,
    @Body('mobileNumber') mobileNumber: string,
    @Headers('x-api-key') apiKey: string,
  ): Promise<any> {
    if (!this.valuService.validateHeaders(apiKey))
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    if (!mobileNumber)
      throw new HttpException(
        'Mobile Number Is Missing',
        HttpStatus.BAD_REQUEST,
      );
    return await this.valuService.customerStatus(mobileNumber);
  }

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
    return await this.valuService.enquiry(enquiryParams);
  }
}
