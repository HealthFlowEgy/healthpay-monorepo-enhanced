import 'reflect-metadata';
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Balance } from './fence-balance.model';
import { User } from './fence-user.model';

@ObjectType()
export class Wallet {
  @Field(() => Int)
  id: number;

  @Field(() => Float)
  total: number;

  @Field(() => [Balance], { nullable: true })
  balance: Balance[];

  @Field(() => [ParentWallet], { nullable: true })
  parentWallets: ParentWallet[];
}

@ObjectType()
export class ParentWallet {
  @Field(() => Int)
  id: number;

  @Field(() => Float)
  total: number;

  @Field(() => String)
  status: string;

  @Field(() => Boolean)
  isDefault: boolean;

  @Field(() => Date, { nullable: true })
  activeTo: Date | null;

  @Field(() => Date, { nullable: true })
  createdAt: Date | null;

  @Field(() => User, { nullable: false })
  user: User;
}
