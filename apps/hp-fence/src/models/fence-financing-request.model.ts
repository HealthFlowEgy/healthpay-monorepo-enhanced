/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';

@ObjectType()
export class FinancingRequest {
    @Field(() => String)
    uid: string;

    @Field(() => String, { nullable: true })
    reason?: string | null;

    @Field(() => String, { nullable: true })
    status?: string | null;

    @Field(() => String, { nullable: true })
    fullName?: string | null;

    @Field(() => Number, { nullable: true })
    requestedAmount?: number | null;

    @Field(() => Number, { nullable: true })
    approvedAmount?: number | null;

    @Field(() => Date)
    createdAt: Date | null;

    @Field(() => Date)
    updatedAt: Date | null;

}
