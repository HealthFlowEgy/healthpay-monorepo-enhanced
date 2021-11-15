/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';
import 'reflect-metadata';
import { User } from './fence-user.model';

@ObjectType()
export class Merchant {
  @Field(() => String)
  uid: string;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  img?: string | null;
}
