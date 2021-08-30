import { NestFactory } from '@nestjs/core';
import { HpSwordModule } from './hp-sword.module';

async function bootstrap() {
  const app = await NestFactory.create(HpSwordModule);
  await app.listen(3001);
}
bootstrap();
