import 'reflect-metadata';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Merchant } from './fence-merchant.model';
import { PaymentRequestConsent } from '@prisma/client';
import { Transaction } from './fence-transaction.model';
import { User } from './fence-user.model';

@ObjectType()
export class PaymentRequest {
  @Field(() => String)
  uid: string;

  @Field(() => Number)
  amount: number;

  @Field(() => Merchant, { nullable: true })
  merchant?: Merchant | null;

  @Field(() => Transaction, { nullable: true })
  transaction?: Transaction | null;

  @Field(() => User, { nullable: true })
  sender?: User | null;

  @Field(() => User)
  user: User | null;

  @Field(() => PaymentRequestConsent)
  consent: PaymentRequestConsent;

  @Field(() => String, { nullable: true })
  note: string;

  @Field(() => Date)
  createdAt: Date | null;

  @Field(() => Date)
  updatedAt: Date | null;
}

registerEnumType(PaymentRequestConsent, {
  name: 'PaymentRequestConsent',
});

export const UpdatablePaymentRequestConsent = (({ FORCED, PENDING, ...o }) =>
  o)(PaymentRequestConsent);

registerEnumType(UpdatablePaymentRequestConsent, {
  name: 'UpdatablePaymentRequestConsent',
});
