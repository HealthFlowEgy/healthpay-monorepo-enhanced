/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';
import { User } from './sword-user.model';

@ObjectType()
export class Merchant {
  @Field(() => String)
  uid: string;

  @Field(() => User)
  owner: User;
}

@ObjectType()
export class MerchantWithToken {
  @Field(() => String)
  token: string;

  @Field(() => Merchant, { nullable: true })
  merchant: Merchant;
}
