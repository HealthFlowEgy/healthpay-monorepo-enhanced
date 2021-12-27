import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    this.$use(async (params, next) => {
      // TODO: Add prisma logging middleware
      const before = Date.now();
      if (params.action == 'createMany' || params.action == 'create') {
        params.args['data'] = {
          ...params.args['data'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      const result = await next(params);
      const after = Date.now();
      console.log(
        `Query ${params.model}.${params.action} took ${after - before}ms`,
      );
      return result;
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
