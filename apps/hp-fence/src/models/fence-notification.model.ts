import { Field, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';

@ObjectType()
export class Notification {
  @Field(() => Number)
  id: number;

  @Field(() => String, { nullable: true })
  msg: string | null;

  @Field(() => String, { nullable: true })
  msg_ar: string | null;

  @Field(() => String, { nullable: true })
  vars: string | null;

  @Field(() => Date)
  createdAt: Date;
}
