import 'reflect-metadata';
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Balance } from './sword-balance.model';

@ObjectType()
export class PaymentRequest {
  @Field(() => Int)
  id: number;

  @Field(() => Float)
  amount: number;

  @Field(() => String)
  status: string;

  @Field(() => Date)
  createdAt: Date;
}
