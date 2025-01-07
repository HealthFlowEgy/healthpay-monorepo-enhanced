import 'reflect-metadata';

import { Field, Float, ObjectType } from '@nestjs/graphql';

import { CashOutUserSettings } from './fence-cashout-user-settings.model';

@ObjectType()
export class CashOutRequest {
  @Field(() => String)
  uid: string;

  @Field(() => Number)
  amount: number;

  @Field(() => String)
  status: string;

  @Field(() => String, { nullable: true })
  comment?: string;

  @Field(() => Number)
  createdAt: Date | null;

  @Field(() => Number)
  updatedAt: Date | null;

  // @Field(() => CashOutUserSettings, { nullable: true })
  // cashOutUserSettings: CashOutUserSettings | null;
}
