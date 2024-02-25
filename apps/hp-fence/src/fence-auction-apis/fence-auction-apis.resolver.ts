import { ServicesService } from '@app/services';
import { Inject, Logger, UseGuards } from '@nestjs/common';
import { Query, Resolver, Mutation, Args } from '@nestjs/graphql';
import { CurrentUser } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FinancingRequest } from '../models/fence-financing-request.model';
import { User } from '../models/fence-user.model';
import { AuctionModel, AuctionStatusInput } from '../models/fence-auction.model';
import { AuctionOffersStatus, Prisma } from '@prisma/client';



@Resolver()
export class FenceAuctionApisResolver {
    private logger = new Logger(FenceAuctionApisResolver.name);

    constructor(@Inject(ServicesService) private services: ServicesService) { }



    @Query(() => [AuctionModel])
    @UseGuards(JwtAuthGuard)
    async activeAuctions(
        @CurrentUser() user: User,
    ): Promise<AuctionModel[]> {
        return this.services.sharedAuctionService.getActiveAuctions();
    }



    @Query(() => [AuctionModel])
    @UseGuards(JwtAuthGuard)
    async myActiveAuctions(
        @CurrentUser() user: User,
    ): Promise<AuctionModel[]> {
        return this.services.sharedAuctionService.getActiveAuctionByUserId(user.id, {
            status: AuctionOffersStatus.PENDING
        });
    }


    @Query(() => [AuctionModel])
    @UseGuards(JwtAuthGuard)
    async myAuctionHistory(
        @CurrentUser() user: User,
        @Args('filter', { nullable: true }) filter: AuctionStatusInput,
    ): Promise<AuctionModel[]> {
        
        this.logger.log(`myAuctionHistory: ${JSON.stringify(filter)}`);
        this.logger.log(`myAuctionHistory: ${JSON.stringify(user)}`);

        return this.services.sharedAuctionService.getActiveAuctionByUserId(user.id, {
            status: filter?.onlyStatus ?? {
                in: [AuctionOffersStatus.COMPLETED, AuctionOffersStatus.PENDING]
            }
        });
    }


    @Mutation(() => AuctionModel)
    @UseGuards(JwtAuthGuard)
    async subscribeToAuctionOffer(
        @CurrentUser() user: User,
        @Args('auctionId') auctionId: number,
    ): Promise<AuctionModel> {
        return this.services.sharedAuctionService.addUserToApplicantPool(auctionId, user.id);
    }


}
