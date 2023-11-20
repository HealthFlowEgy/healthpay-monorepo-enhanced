import { ServicesService } from '@app/services';
import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Post,
  Render,
  Res,
} from '@nestjs/common';
import { UserPayoutServiceRequest } from '@prisma/client';
import { urlencoded } from 'express';

@Controller('/khadamaty')
export class KhadamatyController {
  private readonly logger = new Logger(KhadamatyController.name);

  constructor(
    @Inject(ServicesService)
    private serviceService: ServicesService,
  ) {}

  @Get('/')
  @Render('khadamaty/category-list')
  async getCatalog(): Promise<any> {
    const catalog =
      await this.serviceService.sharedKhadamatyService.getKhadamatyServices(
        'catalog',
      );

    return {
      catalog: catalog.data,
    };
  }

  @Get('/billers/:categoryId')
  @Render('khadamaty/biller-list')
  async getBillersByCategoryId(
    @Param('categoryId') categoryId: string,
  ): Promise<any> {
    const services = (
      await this.serviceService.sharedKhadamatyService.getKhadamatyServices(
        'services',
      )
    ).data.filter((el: any) => el.CategoryId === parseInt(categoryId));

    let billers = [];
    for (let index = 0; index < services.length; index++) {
      const element = services[index];
      billers.push({
        name: element.BillerName,
        id: element.BillerId,
      });
    }
    // billers unique by id
    billers = billers.filter(
      (thing, index, self) =>
        index === self.findIndex((t) => t.id === thing.id),
    );

    return {
      catalog: await this.serviceService.sharedKhadamatyService.getCategoryById(
        categoryId,
      ),
      billers,
    };
  }

  @Get('/services/:categoryId/:billerId')
  @Render('khadamaty/service-list')
  async getServices(
    @Param('categoryId') categoryId: string,
    @Param('billerId') billerId: string,
  ): Promise<any> {
    const services = (
      await this.serviceService.sharedKhadamatyService.getKhadamatyServices(
        'services',
      )
    ).data.filter(
      (el: any) =>
        el.CategoryId === parseInt(categoryId) &&
        el.BillerId === parseInt(billerId),
    );

    return {
      catalog: await this.serviceService.sharedKhadamatyService.getCategoryById(
        categoryId,
      ),
      services,
    };
  }

  @Get('/service/:serviceId')
  @Render('khadamaty/service-details-form')
  async showServiceForm(@Param('serviceId') serviceId: string): Promise<any> {
    const service =
      await this.serviceService.sharedKhadamatyService.getServiceById(
        serviceId,
      );

    return {
      service,
    };
  }

  // @Get('/fees/service/:serviceId')
  // @Render('khadamaty/service-results-form')
  // async getServiceFees(
  //   @Param('serviceId') serviceId: string,
  //   @Body() body: any,
  //   @Res() res: any,
  // ): Promise<any> {
  //   if (!body.service) {
  //     return res.redirect(`/khadamaty/service/${serviceId}`);
  //   }

  //   const service =
  //     await this.serviceService.sharedKhadamatyService.getServiceById(
  //       serviceId,
  //     );
  //   const strBody = new URLSearchParams(body.service).toString();
  //   const paymentURL = `/khadamaty/pay/service/${serviceId}?` + strBody;

  //   try {
  //     const serviceFees =
  //       await this.serviceService.sharedKhadamatyService.CalculateFees(
  //         service,
  //         body.service,
  //       );

  //     if (serviceFees.StatusCode != 1) {
  //       return {
  //         service,
  //         error: serviceFees.StatusDescription || 'خطأ في الخدمة',
  //       };
  //     }

  //     return {
  //       service,
  //       serviceFees,
  //       filledFields:
  //         this.serviceService.sharedKhadamatyService.fillFieldValues(
  //           service,
  //           body,
  //         ),
  //       payable: parseFloat(`${serviceFees.Amount + 1.02 + 2}`).toFixed(2),
  //       paymentURL,
  //     };
  //   } catch (e) {
  //     return {
  //       error: e,
  //     };
  //   }
  // }

  @Post('/service/:serviceId')
  @Render('khadamaty/service-results-form')
  async getServiceInq(
    @Param('serviceId') serviceId: string,
    @Body() body: any,
    @Res() res: any,
  ): Promise<any> {
    const service =
      await this.serviceService.sharedKhadamatyService.getServiceById(
        serviceId,
      );

    const nBody = {
      ...body,
      service: this.serviceService.sharedKhadamatyService.parseBodyObject(
        body.service,
      ),
    };

    let serviceFees: any = {};

    try {
      if (
        service.ServiceFields.length <= 0 ||
        service.ServiceFields.filter((el) => el.Inquiry).length <= 0 ||
        service.Inquirable == 0
      ) {
        serviceFees =
          await this.serviceService.sharedKhadamatyService.CalculateFees(
            service,
            nBody.service,
          );
      } else {
        serviceFees = await this.serviceService.sharedKhadamatyService.Inquiry(
          service,
          nBody.service,
        );
      }

      if (serviceFees.StatusCode != 1) {
        return {
          service,
          error: serviceFees.StatusDescription || 'خطأ في الخدمة',
        };
      }

      // const strBody = new URLSearchParams({
      //   ...nBody.service,
      //   ...serviceFees,
      // }).toString();

      // const paymentURL = `/khadamaty/pay/service/${serviceId}?` + strBody;
      const filledFields =
        this.serviceService.sharedKhadamatyService.fillFieldValues(
          service,
          nBody.service,
        );

      const payable = parseFloat(`${serviceFees.Amount + 1.02 + 2}`).toFixed(2);
      const UserPayoutServiceRequest: UserPayoutServiceRequest =
        await this.serviceService.sharedKhadamatyService.createUserPayoutServiceRequest(
          {
            serviceId: parseInt(serviceId),
            serviceFields: filledFields.map(
              (el) => ({ Value: el.Value, SFId: el.SFId } as any),
            ),
            amount: parseFloat(payable),
          },
        );

      return {
        service,
        serviceFees,
        filledFields,
        payable,
        UserPayoutServiceRequest,
      };
    } catch (e) {
      console.log(e);
      return {
        error: e,
      };
    }
  }

  @Get('/pay/service/:serviceId')
  @Render('khadamaty/service-payment')
  async payService(
    @Param('serviceId') serviceId: string,
    @Body() body: any,
  ): Promise<any> {
    const service =
      await this.serviceService.sharedKhadamatyService.getServiceById(
        serviceId,
      );
    return {
      service,
    };
  }
}
