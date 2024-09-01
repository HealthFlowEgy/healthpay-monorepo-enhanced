import 'reflect-metadata';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';

import { CashOutMethod } from './fence-cashout-method.model';
import { IsEmail } from 'class-validator';
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

  @Field(() => String, { nullable: true })
  prefLang?: string | null;

  @Field(() => String, { nullable: true })
  nationalId?: string | null;

  @Field(() => String, { nullable: true })
  nationalDocFront?: string | null;

  @Field(() => String, { nullable: true })
  nationalDocBack?: string | null;

  @Field(() => String, { nullable: true })
  nationalDoc?: string | null;

  @Field(() => Boolean, { nullable: true })
  isNationalVerified?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  isDeactivated?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  isVerified?: boolean | null;

  @Field(() => Date, { nullable: true })
  createdAt?: Date | null;
}

@ObjectType()
export class UserWithToken {
  @Field(() => String)
  token: string;

  @Field(() => User, { nullable: true })
  user: User;
}
