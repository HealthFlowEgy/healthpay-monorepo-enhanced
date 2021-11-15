import { Field, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';

@ObjectType()
export class CashOutMethodLength {
  @Field(() => Number)
  id: number;

  @Field(() => Number)
  length: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
