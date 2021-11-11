import { NestFactory } from '@nestjs/core';
import { HpFenceModule } from './hp-fence.module';

async function bootstrap() {
  const app = await NestFactory.create(HpFenceModule);
  app.enableCors();
  await app.listen(3002);
}
bootstrap();
