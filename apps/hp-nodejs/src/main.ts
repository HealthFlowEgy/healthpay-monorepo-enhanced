import { NestFactory } from '@nestjs/core';
import { HpNodejsModule } from './hp-nodejs.module';

async function bootstrap() {
  const app = await NestFactory.create(HpNodejsModule);
  await app.listen(3000);
}
bootstrap();
