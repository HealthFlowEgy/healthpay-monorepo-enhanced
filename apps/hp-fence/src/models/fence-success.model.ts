/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';

@ObjectType()
export class Success {
  @Field(() => Boolean)
  isSuccess: boolean;
}
