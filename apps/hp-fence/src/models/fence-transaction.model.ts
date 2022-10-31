/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';
import { Wallet } from './fence-wallet.model';

@ObjectType()
export class Transaction {
  @Field(() => String)
  uid: string;

  @Field(() => String)
  iframeUrl?: string;

  @Field(() => String)
  status?: string;

  @Field(() => String)
  amount?: number;
}
