import 'reflect-metadata';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class IAM {
  @Field(() => String)
  date: string | null;
}
