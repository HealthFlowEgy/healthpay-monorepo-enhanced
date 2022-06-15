import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HpSwordModule } from './hp-sword.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(HpSwordModule);
  app.set('trust proxy', process.env.NGINX_VHOST_TRUSTPROXY || 1);
  await app.listen(3001);
}
bootstrap();
