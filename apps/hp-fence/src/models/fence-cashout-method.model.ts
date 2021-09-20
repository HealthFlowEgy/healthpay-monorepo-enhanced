import { Field, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';
import { CashOutMethodLength } from './fence-cashout-method-length.model';

@ObjectType()
export class CashOutMethod {
  @Field(() => Number)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  abbreviation: string;

  @Field(() => String)
  bic: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [CashOutMethodLength])
  length: [CashOutMethodLength];
}
