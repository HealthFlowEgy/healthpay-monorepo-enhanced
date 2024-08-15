import { Merchant, User } from '@prisma/client';

export interface SortedBalance {
  uid: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  notes: string;
  createdAt: Date;
  merchant?: Merchant;
  user?: User;
}
