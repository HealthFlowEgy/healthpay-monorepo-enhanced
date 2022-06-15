import { ServicesService } from '@app/services';
import { Inject, UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FinancingRequest } from '../models/fence-financing-request.model';
import { PaymentRequest } from '../models/fence-payment-request.model';
import { User } from '../models/fence-user.model';
@Resolver()
export class PaymentRequestApisResolver {
    constructor(@Inject(ServicesService) private services: ServicesService) { }
    @Query(() => [PaymentRequest])
    @UseGuards(JwtAuthGuard)
    async paymentRequests(
        @CurrentUser() user: User,
    ): Promise<any> {
        const requests = await this.services.sharedPaymentRequest.getPendingPaymentRequestsByUserId(user.id);
        console.log(requests);
        return this.services.sharedPaymentRequest.getPendingPaymentRequestsByUserId(user.id);
    }
}
