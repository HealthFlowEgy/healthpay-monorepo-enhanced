/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';

import { Type } from '@nestjs/common';

export interface IResponseType<T> {
  data: T;
  error?: string | null;
  success: boolean;
}

export function Response<T>(classRef: Type<T>): Type<IResponseType<T>> {
  @ObjectType({ isAbstract: true })
  abstract class ResponseType implements IResponseType<T> {
    @Field((type) => classRef, { nullable: true })
    data: T;

    @Field((type) => String, { nullable: true })
    error: string | null;

    @Field()
    success: boolean;
  }
  return ResponseType as Type<IResponseType<T>>;
}
