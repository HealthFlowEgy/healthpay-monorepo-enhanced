import { HelpersService } from '@app/helpers';
import { OnelinkService } from '@app/helpers/onelink.service';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import {
  Merchant,
  PaymentRequest,
  PaymentRequestConsent,
  Prisma,
  User,
} from '@prisma/client';
import { SharedTransactionService } from '../shared-transaction/shared-transaction.service';

@Injectable()
export class SharedPaymentRequestService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(OnelinkService) private onelink: OnelinkService,
    @Inject(SharedTransactionService)
    private transaction: SharedTransactionService,
  ) {}

  async createPaymentRequest(
    user: User,
    amount: number,
    note: string | null = 'new_payment_request',
    merchant: Merchant | null = null,
    sender: User | null = null,
    consent: PaymentRequestConsent | null = 'FORCED',
  ): Promise<PaymentRequest> {
    const data: Prisma.PaymentRequestCreateInput = {
      uid: this.helpers.doCreateUUID('paymentRequest'),
      amount,
      status: 'PENDING',
      consent: consent,
      note,
      user: {
        connect: {
          id: user.id,
        },
      },
    };

    if (merchant) {
      data.merchant = {
        connect: {
          id: merchant.id,
        },
      };
    }
    if (sender) {
      data.sender = {
        connect: {
          id: sender.id,
        },
      };
    }

    return this.prisma.paymentRequest.create({
      data,
    });
  }

  async getPaymentRequest(uid: string): Promise<PaymentRequest> {
    return this.prisma.paymentRequest.findFirst({
      where: {
        uid,
      },
    });
  }

  async getPaymentRequestById(id: number): Promise<PaymentRequest> {
    return this.prisma.paymentRequest.findFirst({
      where: {
        id,
      },
    });
  }

  async getPaymentRequestsByUserId(userId: number): Promise<PaymentRequest[]> {
    return this.prisma.paymentRequest.findMany({
      where: {
        userId,
      },
    });
  }

  async getPendingPaymentRequestsByUserId(
    userId: number,
    includeSentByMe = false,
  ): Promise<PaymentRequest[]> {
    const OR = includeSentByMe
      ? [
          {
            user: {
              id: userId,
            },
          },
          {
            sender: {
              id: userId,
            },
          },
        ]
      : [
          {
            user: {
              id: userId,
            },
          },
        ];
    return this.prisma.paymentRequest.findMany({
      where: {
        OR,
        status: 'PENDING',
      },
      include: {
        merchant: true,
        transaction: true,
        sender: true,
        user: true,
      },
    });
  }

  async getProcessingPaymentRequests(
    where: Prisma.PaymentRequestFindManyArgs,
  ): Promise<PaymentRequest[]> {
    where.where = {
      ...where.where,
      status: 'CANCELLED',
    };
    return this.prisma.paymentRequest.findMany({
      ...where,
    });
  }

  async getPayablePendingRequests(
    userId: number,
    amount: number,
  ): Promise<PaymentRequest[]> {
    return this.prisma.paymentRequest.findMany({
      where: {
        user: {
          id: userId,
        },
        status: 'PENDING',
        consent: {
          in: ['FORCED', 'ACCEPTED'],
        },
        amount: {
          lte: amount,
        },
      },
      orderBy: {
        amount: 'asc',
      },
    });
  }

  async resolvePaymentRequest(
    paymentRequest: PaymentRequest,
  ): Promise<PaymentRequest> {
    return this.prisma.paymentRequest.update({
      where: {
        id: paymentRequest.id,
      },
      data: {
        status: 'APPROVED',
      },
    });
  }

  async markPaymentRequestAsProcessing(
    paymentRequest: PaymentRequest,
  ): Promise<PaymentRequest> {
    return this.prisma.paymentRequest.update({
      where: {
        id: paymentRequest.id,
      },
      data: {
        status: 'CANCELLED',
      },
    });
  }
  async markPaymentRequestAsPending(
    paymentRequest: PaymentRequest,
  ): Promise<PaymentRequest> {
    return this.prisma.paymentRequest.update({
      where: {
        id: paymentRequest.id,
      },
      data: {
        status: 'PENDING',
      },
    });
  }

  async getPendingPaymentRequestWhereWalletHaveMoney() {
    return this.prisma.paymentRequest.findMany({
      where: {
        status: 'PENDING',
        consent: {
          in: ['FORCED', 'ACCEPTED'],
        },
        user: {
          wallet: {
            is: {
              total: {
                gt: 5,
              },
            },
          },
        },
      },
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
      },
    });
  }

  async updatePaymentRequestConsent(
    paymentRequest: PaymentRequest,
    consent: PaymentRequestConsent,
  ): Promise<PaymentRequest> {
    return this.prisma.paymentRequest.update({
      where: {
        id: paymentRequest.id,
      },
      data: {
        consent,
      },
    });
  }
}
