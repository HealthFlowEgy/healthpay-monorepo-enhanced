import { HelpersService } from '@app/helpers';
import { OnelinkService } from '@app/helpers/onelink.service';
import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { Merchant, PaymentRequest, Prisma, User } from '@prisma/client';
import { SharedTransactionService } from '../shared-transaction/shared-transaction.service';

@Injectable()
export class SharedPaymentRequestService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(OnelinkService) private onelink: OnelinkService,
    @Inject(SharedTransactionService)
    private transaction: SharedTransactionService,
  ) { }

  async createPaymentRequest(
    user: User,
    merchant: Merchant,
    amount: number,
  ): Promise<PaymentRequest> {
    // const transaction = await this.transaction.doCreateTransaction(
    //   user,
    //   amount,
    //   merchant,
    // );
    return this.prisma.paymentRequest.create({
      data: {
        uid: this.helpers.doCreateUUID('paymentRequest'),
        amount,
        status: 'PENDING',
        // transaction: {
        //   connect: {
        //     id: transaction.id,
        //   },
        // },
        merchant: {
          connect: {
            id: merchant.id,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
      },
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
  ): Promise<PaymentRequest[]> {
    return this.prisma.paymentRequest.findMany({
      where: {
        user: {
          id: userId,
        },
        status: 'PENDING',
      },
      include: {
        merchant: true,
        transaction: true,
      }
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
}
