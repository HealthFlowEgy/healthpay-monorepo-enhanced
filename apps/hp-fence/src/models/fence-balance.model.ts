import { Field, Float, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';
import { Merchant } from './fence-merchant.model';
import { User } from './fence-user.model';

@ObjectType()
export class Balance {
  @Field(() => String)
  uid: string;

  @Field(() => Float)
  amount: number;

  @Field(() => String)
  type: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  confirmedAt: Date;

  @Field(() => Date)
  rejectedAt: Date;

  @Field(() => User, { nullable: true })
  user: User | null;

  @Field(() => Merchant, { nullable: true })
  merchant: Merchant | null;
}
