import 'reflect-metadata';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';

import { Merchant } from './fence-merchant.model';
import { Transaction } from './fence-transaction.model';
import { User } from './fence-user.model';

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

  @Field(() => User, { nullable: true })
  sender?: User | null;

  @Field(() => User)
  user: User | null;

  @Field(() => String)
  consent: string;

  @Field(() => String, { nullable: true })
  notes: string;

  @Field(() => Date)
  createdAt: Date | null;

  @Field(() => Date)
  updatedAt: Date | null;
}
