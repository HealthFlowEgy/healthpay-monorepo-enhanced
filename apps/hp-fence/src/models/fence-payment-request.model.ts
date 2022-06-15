/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';
import { Merchant } from './fence-merchant.model';
import { Transaction } from './fence-transaction.model';

@ObjectType()
export class PaymentRequest {
    @Field(() => String)
    uid: string;

    @Field(() => Number)
    amount: number;

    @Field(() => Merchant, { nullable: true })
    merchant?: Merchant | null;

    @Field(() => Transaction, { nullable: true })
    transaction?: Transaction | null;

    @Field(() => Date)
    createdAt: Date | null;

    @Field(() => Date)
    updatedAt: Date | null;


}
