import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Post,
  Render,
} from '@nestjs/common';

import { ServicesService } from '@app/services';
import {
  IBasataProviders,
  IBasataTransactionInquiry,
} from '@app/helpers/basata.service';
import { TransactionInquiryDto } from './TransactionInquiry.dto';

@Controller('/bills')
export class BillsController {
  private readonly logger = new Logger(BillsController.name);

  constructor(
    @Inject(ServicesService)
    private serviceService: ServicesService,
  ) {}

  // @Get('/providers')
  // async getCatalog(): Promise<IBasataProviders> {
  //   return this.serviceService.sharedBillsService.getBillsProviders();
  // }

  // @Get('/provider/:providerId/services')
  // async getServices(@Param('providerId') providerId: string): Promise<any> {
  //   return this.serviceService.sharedBillsService.getBillsServices(
  //     Number(providerId),
  //   );
  // }

  // @Get('/service/:serviceId/params')
  // async getServiceParams(@Param('serviceId') serviceId: string): Promise<any> {
  //   return this.serviceService.sharedBillsService.getServiceInputParams(
  //     Number(serviceId),
  //   );
  // }

  // @Post('/service/:serviceId/inquiry')
  // async transactionInquiry(
  //   @Param('serviceId') serviceId: string,
  //   @Body() { input_parameter_list }: TransactionInquiryDto,
  // ): Promise<IBasataTransactionInquiry> {
  //   return this.serviceService.sharedBillsService.transactionInquiry(
  //     Number(serviceId),
  //     input_parameter_list,
  //   );
  // }
}
