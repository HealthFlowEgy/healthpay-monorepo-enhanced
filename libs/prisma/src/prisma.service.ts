import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
    this.$use(async (params, next) => {
      // TODO: Add prisma logging middleware
      if (params.action == 'createMany' || params.action == 'create') {
        params.args['data'] = {
          ...params.args['data'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
