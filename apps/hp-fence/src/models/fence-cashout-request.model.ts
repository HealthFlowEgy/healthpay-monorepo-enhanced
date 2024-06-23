import { Field, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';
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


  @Field(() => Date)
  createdAt: Date | null;

  @Field(() => Date)
  updatedAt: Date | null;

  // @Field(() => CashOutUserSettings, { nullable: true })
  // cashOutUserSettings: CashOutUserSettings | null;
}
