import 'reflect-metadata';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MedCard {
  @Field(() => String)
  uid: string | null;

  @Field(() => String)
  nationalId: string | null;

  @Field(() => Boolean)
  isActive: boolean | null;

  @Field(() => String)
  nameOnCard: string | null;

  @Field(() => String)
  birthDate: string | null;

  @Field(() => String)
  img: string | null;
}
