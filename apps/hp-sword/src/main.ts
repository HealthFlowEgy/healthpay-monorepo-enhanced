import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { HpSwordModule } from './hp-sword.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(HpSwordModule);

  app.set('trust proxy', 'loopback');
  await app.listen(3000);
}
bootstrap();
