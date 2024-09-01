/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';

import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, MinLength } from 'class-validator';

import { Response } from './fence-response.model';

@ObjectType()
export class IGQLBasataProviders {
  @Field(() => String, { nullable: true })
  id: number;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  name_ar: string;
}

@ObjectType()
export class IGQLBasataProvidersList {
  @Field(() => [IGQLBasataProviders], { nullable: true })
  provider_list: IGQLBasataProviders[];

  @Field(() => Number, { nullable: true })
  service_version: number;
}

@ObjectType()
export class IGQLBasataServiceCharge {
  @Field(() => Number, { nullable: true })
  from: number;

  @Field(() => Number, { nullable: true })
  to: number;

  @Field(() => Number, { nullable: true })
  charge: number;

  @Field(() => Number, { nullable: true })
  slap: number;

  @Field(() => Boolean, { nullable: true })
  percentage: boolean;
}

@ObjectType()
export class IGQLBasataServices {
  @Field(() => Number, { nullable: true })
  id: number;

  @Field(() => Number, { nullable: true })
  provider_id: number;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  name_ar: string;

  @Field(() => String, { nullable: true })
  price_type: string;

  @Field(() => Number, { nullable: true })
  service_value: number;

  @Field(() => Number, { nullable: true })
  min_quantity: number;

  @Field(() => Number, { nullable: true })
  max_quantity: number;

  @Field(() => Number, { nullable: true })
  sort_order: number;

  @Field(() => Boolean, { nullable: true })
  inquiry_required: boolean;

  @Field(() => [IGQLBasataServiceCharge])
  service_charge_list: IGQLBasataServiceCharge[];
}

@ObjectType()
export class IGQLBasataServicesList {
  @Field(() => [IGQLBasataServices], { nullable: true })
  service_list: IGQLBasataServices[];
}

@ObjectType()
export class IGQLBasataServiceInputParam {
  @Field(() => Number, { nullable: true })
  service_id: number;

  @Field(() => String, { nullable: true })
  key: string;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  name_ar: string;

  @Field(() => Number, { nullable: true })
  position: number;

  @Field(() => Boolean, { nullable: true })
  visible: boolean;

  @Field(() => Boolean, { nullable: true })
  required: boolean;

  @Field(() => String, { nullable: true })
  parameter_type: string;

  @Field(() => Boolean, { nullable: true })
  client_id: boolean;

  @Field(() => String, { nullable: true })
  default_value: string;

  @Field(() => Number, { nullable: true })
  min_length: number;

  @Field(() => Number, { nullable: true })
  max_length: number;

  @Field(() => Boolean, { nullable: true })
  confirm_required: boolean;
}

@ObjectType()
export class IGQLBasataServiceInputParams {
  @Field(() => [IGQLBasataServiceInputParam], { nullable: true })
  input_parameter_list: IGQLBasataServiceInputParam[];
}

@ObjectType()
export class IGQLBasataTransactionInquiry {
  @Field(() => String, { nullable: true })
  transaction_id: string;

  @Field(() => Number, { nullable: true })
  status: number;

  @Field(() => String, { nullable: true })
  status_text: string;

  @Field(() => String, { nullable: true })
  date_time: string;

  @Field(() => String, { nullable: true })
  info_text: string;

  @Field(() => Number, { nullable: true })
  amount: number;

  @Field(() => Number, { nullable: true })
  min_amount: number;

  @Field(() => Number, { nullable: true })
  max_amount: number;
}

@ObjectType()
export class IGQLBasataTransactionInquiryResponse extends Response(
  IGQLBasataTransactionInquiry,
) {}

@InputType()
export class IGQLBasataInputParam {
  @Field(() => String)
  @MinLength(1)
  key: string;

  @Field(() => String)
  @MinLength(1)
  value: string;
}

@ObjectType()
export class IGQLBasataDetailsList {
  @Field(() => String, { nullable: true })
  key: string;

  @Field(() => String, { nullable: true })
  value: string;
}

@ObjectType()
export class IGQLBasataTransactionPayment {
  @Field(() => String, { nullable: true })
  transaction_id: string;

  @Field(() => String, { nullable: true })
  status: string;

  @Field(() => String, { nullable: true })
  status_text: string;

  @Field(() => String, { nullable: true })
  date_time: string;

  @Field(() => [[IGQLBasataDetailsList]], { nullable: true })
  details_list: IGQLBasataDetailsList[][];
}

@ObjectType()
export class IGQLBasataTransactionPaymentResponse extends Response(
  IGQLBasataTransactionPayment,
) {}
