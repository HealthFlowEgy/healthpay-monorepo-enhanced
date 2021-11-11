import { HelpersService } from '@app/helpers';
import { ValuService } from '@app/helpers/valu.service';
import {
  ValuEnquiryParams,
  ValuPurchaseParams,
  ValuVerifyCustomerParams,
} from '@app/helpers/valu.types';
import { ServicesService } from '@app/services';
import { ValidationsService } from '@app/validations';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common';

@Controller('valu')
export class ValuController {
  constructor(
    @Inject(ServicesService) private services: ServicesService,
    @Inject(ValuService) private valuService: ValuService,
    @Inject(ValidationsService) private validation: ValidationsService,
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
    const orderId = await this.services.sharedUser.getValuOrderIdByHmac(id);
    if (!this.valuService.validateApiKey(apiKey))
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    if (!mobileNumber)
      throw new HttpException(
        'Mobile Number Is Missing',
        HttpStatus.BAD_REQUEST,
      );
    if (!orderId)
      throw new HttpException('Not Valid HMac', HttpStatus.BAD_REQUEST);
    return await this.valuService.customerStatus(mobileNumber);
  }
  @Post('/verifyHmac')
  async verifyHmac(
    @Headers('x-api-key') apiKey: string,
    @Body('hmac') hmac: string,
  ): Promise<any> {
    if (!this.valuService.validateApiKey(apiKey))
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    return {
      orderId: await this.services.sharedUser.getValuOrderIdByHmac(hmac),
    };
  }
  @Post('/enquiry/:id')
  async enquiry(
    @Param('id') id: string,
    @Body('mobileNumber') mobileNumber: string,
    @Body('productId') productId: string,
    @Headers('x-api-key') apiKey: string,
  ): Promise<any> {
    const orderId = await this.services.sharedUser.getValuOrderIdByHmac(id);
    if (!this.valuService.validateApiKey(apiKey))
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    if (!mobileNumber)
      throw new HttpException(
        'Mobile Number Is Missing',
        HttpStatus.BAD_REQUEST,
      );
    if (!productId)
      throw new HttpException('Product ID Is Missing', HttpStatus.BAD_REQUEST);
    if (!orderId)
      throw new HttpException('Not Valid HMac', HttpStatus.BAD_REQUEST);
    const enquiryParams: ValuEnquiryParams = {
      mobileNumber: mobileNumber,
      productList: [
        {
          productId: productId,
          productPrice: 500,
          orderId: orderId,
          downPayment: 0,
          ToUAmount: 0,
          CashbackAmount: 0,
        },
      ],
    };
    return await this.valuService.enquiry(enquiryParams);
  }

  @Post('/verifyCustomer/:id')
  async verifyCustomer(
    @Param('id') id: string,
    @Body('mobileNumber') mobileNumber: string,
    @Headers('x-api-key') apiKey: string,
  ): Promise<any> {
    const orderId = await this.services.sharedUser.getValuOrderIdByHmac(id);
    if (!this.valuService.validateApiKey(apiKey))
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    if (!mobileNumber)
      throw new HttpException(
        'Mobile Number Is Missing',
        HttpStatus.BAD_REQUEST,
      );
    if (!orderId)
      throw new HttpException('Not Valid HMac', HttpStatus.BAD_REQUEST);
    const verifyParams: ValuVerifyCustomerParams = {
      mobileNumber: mobileNumber,
      orderId: orderId,
    };
    return await this.valuService.verifyCustomer(verifyParams);
  }

  @Post('/purchase/:id')
  async purchase(
    @Param('id') id: string,
    @Body('mobileNumber') mobileNumber: string,
    @Body('otp') otp: string,
    @Body('productId') productId: string,
    @Headers('x-api-key') apiKey: string,
  ): Promise<any> {
    const orderId = await this.services.sharedUser.getValuOrderIdByHmac(id);
    if (!this.valuService.validateApiKey(apiKey))
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    if (!mobileNumber)
      throw new HttpException(
        'Mobile Number Is Missing',
        HttpStatus.BAD_REQUEST,
      );

    const purchaseParams: ValuPurchaseParams = {
      otp: otp,
      mobileNumber: mobileNumber,
      productList: [
        {
          productId: productId,
          productPrice: 500,
          orderId: orderId,
          downPayment: 0,
          ToUAmount: 0,
          CashbackAmount: 0,
          tenure: 9,
        },
      ],
    };
    if (!orderId)
      throw new HttpException('Not Valid HMac', HttpStatus.BAD_REQUEST);
    return await await this.valuService.purchase(purchaseParams);
  }
}
// TODO: add decorator for valu api key and hmac
