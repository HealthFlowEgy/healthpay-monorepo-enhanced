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


  @Field(() => String, { nullable: true })
  notes?: string;


  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  confirmedAt: Date | null;

  @Field(() => Date, { nullable: true })
  rejectedAt: Date | null;

  @Field(() => User, { nullable: true })
  user: User | null;

  @Field(() => Merchant, { nullable: true })
  merchant: Merchant | null;
}
