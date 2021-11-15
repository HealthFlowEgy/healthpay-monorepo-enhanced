import { Field, Float, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';

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
}
