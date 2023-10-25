import 'reflect-metadata';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MedCard {
  @Field(() => String, { nullable: true })
  uid: string | null;

  @Field(() => String, { nullable: true })
  nationalId: string | null;

  @Field(() => Boolean, { nullable: true })
  isActive: boolean | null;

  @Field(() => String, { nullable: true })
  nameOnCard: string | null;

  @Field(() => String, { nullable: true })
  birthDate: string | null;

  @Field(() => String, { nullable: true })
  img: string | null;
}
