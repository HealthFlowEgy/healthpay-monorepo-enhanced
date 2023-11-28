/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';

import 'reflect-metadata';

@ObjectType()
export class Success {
  @Field(() => Boolean)
  isSuccess: boolean;
}

@ObjectType()
export class Fields {
  @Field(() => String)
  FieldName: string;

  @Field(() => String)
  Value: string;
}

@ObjectType()
export class Receipt {
  @Field(() => String)
  InvoiceId: string;

  @Field(() => String, { nullable: true })
  ServiceId: string;

  @Field(() => String, { nullable: true })
  ServiceName: string;

  @Field(() => String, { nullable: true })
  PmtType: string;

  @Field(() => String, { nullable: true })
  ProviderId: string;

  @Field(() => String, { nullable: true })
  ProviderName: string;

  @Field(() => String, { nullable: true })
  AgentCode: string;

  @Field(() => String, { nullable: true })
  AgentName: string;

  @Field(() => String, { nullable: true })
  Totalprice: string;

  @Field(() => String, { nullable: true })
  Fees: string;

  @Field(() => String, { nullable: true })
  AddedTime: string;

  @Field(() => String, { nullable: true })
  ServiceCount: string;

  @Field(() => String, { nullable: true })
  Status: string;

  @Field(() => String, { nullable: true })
  Header: string;

  @Field(() => String, { nullable: true })
  InvoiceDescription: string;

  @Field(() => String, { nullable: true })
  Footer: string;

  @Field(() => String, { nullable: true })
  Categoryid: string;

  @Field(() => String, { nullable: true })
  TotalAmount: string;

  @Field(() => String, { nullable: true })
  Date: string;

  @Field(() => String, { nullable: true })
  Time: string;

  @Field(() => [Fields], { nullable: true })
  Fields: Fields[];
}

@ObjectType()
export class SuccessWithMessage {
  @Field(() => Boolean)
  isSuccess: boolean;

  @Field(() => Receipt, { nullable: true })
  Receipt: Receipt | null;

  @Field(() => String, { nullable: true })
  amount: string | null;
}
