import { Prisma } from '@prisma/client';

export type doUpsertUserInput = Pick<
  Prisma.UserCreateInput,
  'firstName' | 'lastName' | 'email' | 'mobile'
>;
