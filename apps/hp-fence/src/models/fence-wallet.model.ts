import 'reflect-metadata';
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Balance } from './fence-balance.model';

@ObjectType()
export class Wallet {
  @Field(() => Int)
  id: number;

  @Field(() => Float)
  total: number;

  @Field(() => [Balance], { nullable: true })
  balance: Balance[];
}
