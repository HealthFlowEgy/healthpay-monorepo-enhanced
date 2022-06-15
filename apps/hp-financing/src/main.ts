import { NestFactory } from '@nestjs/core';
import { HpFinancingModule } from './hp-financing.module';

async function bootstrap() {
  const app = await NestFactory.create(HpFinancingModule);
  await app.listen(3000);
}
bootstrap();
