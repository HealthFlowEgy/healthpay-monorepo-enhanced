import { Prisma } from '@prisma/client';

export type doCreateORLinkUserInput = Pick<
  Prisma.UserCreateInput,
  'firstName' | 'lastName' | 'email' | 'mobile'
>;
