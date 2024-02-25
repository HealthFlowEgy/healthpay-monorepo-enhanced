/* eslint-disable @typescript-eslint/no-unused-vars */
import { ServicesService } from '@app/services';
import { Inject } from '@nestjs/common';
import { Field, InputType, ObjectType, Parent, ResolveField, Resolver, registerEnumType } from '@nestjs/graphql';
import { AuctionOffersStatus } from '@prisma/client';
import 'reflect-metadata';


export type AuctionOffersStatusKeys = [keyof typeof AuctionOffersStatus]


@ObjectType()
export class AuctionModel {
    @Field(() => Number)
    id: number;

    @Field(() => String)
    name: string;


    @Field(() => Number)
    price: number;

    @Field(() => Number)
    maxApplicants: number;


    @Field(() => String, { nullable: true })
    status?: string | null;

    @Field(() => String, { nullable: true })
    img?: string | null;


    @Field(() => String, { nullable: true })
    desc?: string | null;


}

export const AuctionStatusModel = registerEnumType(AuctionOffersStatus, {
    name: 'AuctionOffersStatus',
    description: 'The auction offer status.',
});



@InputType()
export class AuctionStatusInput {
    @Field(() => AuctionOffersStatus, { nullable: true })
    onlyStatus: AuctionOffersStatus;
}


@Resolver(of => AuctionModel)
export class AuctionModelResolver {

    constructor(@Inject(ServicesService) private services: ServicesService) { }


    @ResolveField('AuctionUsers', () => Number)
    async getProductProviders(@Parent() provider: AuctionModel) {
        const { id } = provider;
        return (await this.services.sharedAuctionService.getAuctionById(id)).AuctionUsers.length;
    }
}
