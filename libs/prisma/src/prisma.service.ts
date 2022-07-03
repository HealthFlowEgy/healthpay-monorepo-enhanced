import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

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
      const args =
        params.args && typeof params.args === 'object'
          ? JSON.stringify(params.args)
          : params.args;
      const resultCount = result && result.length ? result.length : 0;
      this.logger.log(
        `Query ${params.model}.${
          params.action
        } ${args}, result: ${resultCount} took ${after - before}ms`,
      );
      return result;
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
