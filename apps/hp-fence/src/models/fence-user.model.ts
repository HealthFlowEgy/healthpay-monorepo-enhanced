/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';
import 'reflect-metadata';
import { CashOutMethod } from './fence-cashout-method.model';
import { Wallet } from './fence-wallet.model';

@ObjectType()
export class User {
  @Field(() => Number)
  id: number;

  @Field(() => String)
  uid: string;

  @Field(() => String, { nullable: true })
  firstName?: string | null;

  @Field(() => String, { nullable: true })
  lastName?: string | null;

  @Field(() => String, { nullable: true })
  @IsEmail()
  email?: string | null;

  @Field(() => String, { nullable: true })
  avatar?: string | null;

  @Field(() => String, { nullable: true })
  mobile?: string | null;

  // @Field(() => [CashOutMethod])
  // cashOutMethods: [CashOutMethod];

  @Field(() => Wallet, { nullable: true })
  wallet: Wallet | null;
}

@ObjectType()
export class UserWithToken {
  @Field(() => String)
  token: string;

  @Field(() => User, { nullable: true })
  user: User;
}
