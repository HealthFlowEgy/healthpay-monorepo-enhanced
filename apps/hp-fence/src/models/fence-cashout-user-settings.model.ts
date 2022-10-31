import { Field, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';
import { CashOutMethod } from './fence-cashout-method.model';

@ObjectType()
export class CashOutUserSettings {
  @Field(() => Number)
  id: number;

  @Field(() => String)
  creditorNo: string;

  @Field(() => Date)
  createdAt: Date | null;

  @Field(() => Date)
  updatedAt: Date | null;

  @Field(() => CashOutMethod, { nullable: true })
  method?: CashOutMethod | null;
}
