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
  abbreviation: string | null;

  @Field(() => String)
  bic: string | null;

  @Field(() => String)
  notes: string | null;

  @Field(() => Date)
  createdAt: Date | null;

  @Field(() => Date)
  updatedAt: Date | null;

  @Field(() => [CashOutMethodLength])
  length: CashOutMethodLength[] | null;
}
