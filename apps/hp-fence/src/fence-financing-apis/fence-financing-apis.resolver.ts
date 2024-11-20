import { ServicesService } from '@app/services';
import { Inject, UseGuards } from '@nestjs/common';
import { Query, Resolver, Mutation, Args } from '@nestjs/graphql';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FinancingRequest } from '../models/fence-financing-request.model';
import { User } from '../models/fence-user.model';
@Resolver()
export class FenceFinancingApisResolver {
  constructor(@Inject(ServicesService) private services: ServicesService) { }
  @Query(() => [FinancingRequest])
  @UseGuards(JwtAuthGuard)
  async financingRequests(
    @CurrentUser() user: User,
  ): Promise<FinancingRequest[]> {
    return this.services.sharedFinanceService.requestsByUserId(user.id);
  }

  @Mutation(() => FinancingRequest)
  @UseGuards(JwtAuthGuard)
  async createFinancingRequest(
    @CurrentUser() user: User,
    @Args('amount') amount: number,
    @Args('reason') reason: string,
    @Args('fullName') fullName: string,
  ): Promise<FinancingRequest> {
    return this.services.sharedFinanceService.createRequest(
      user.id,
      amount,
      reason,
      fullName,
    );
  }
}
