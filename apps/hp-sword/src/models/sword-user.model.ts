/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';
import { Wallet } from './sword-wallet.model';

@ObjectType()
export class User {
  @Field(() => String)
  uid: string;

  @Field(() => String, { nullable: true })
  firstName?: string | null;

  @Field(() => String, { nullable: true })
  lastName?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  mobile?: string | null;

  @Field(() => Wallet, { nullable: true })
  wallet: Wallet | null;
}

@ObjectType()
export class UserWithToken {
  @Field(() => String)
  userToken: string;

  @Field(() => User, { nullable: true })
  user: User;
}
