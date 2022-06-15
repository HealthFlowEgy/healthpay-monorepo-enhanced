import { NestFactory } from '@nestjs/core';
import { HpFenceModule } from './hp-fence.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ThrottleMiddleware } from 'libs/middelwares/ThrottleMiddleware';
import { NestExpressApplication } from '@nestjs/platform-express';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(HpFenceModule);
  app.enableCors();
  app.set('trust proxy', 'loopback');
  const config = new DocumentBuilder()
    .setTitle('HealthPay Fence API Docs')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('mobile app')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('gql/docs', app, document);
  await app.listen(3002);
}
bootstrap();
