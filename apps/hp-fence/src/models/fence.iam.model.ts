/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';
import 'reflect-metadata';

@ObjectType()
export class IAM {
    @Field(() => String)
    date: String | null;


}
