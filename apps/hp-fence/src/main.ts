import { NestFactory } from '@nestjs/core';
import { HpFenceModule } from './hp-fence.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ThrottleMiddleware } from 'libs/middelwares/ThrottleMiddleware';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { create } from 'express-handlebars';
import helpers from './hp-fence-hbs-helpers';

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

  app.useStaticAssets(join(__dirname, '../../..', 'public'));
  // app.setBaseViewsDir(join(__dirname, '../../..', 'views'));
  // hbs.registerPartials(join(__dirname, '../../..', 'views/partials'));

  const hbs = create({
    extname: '.hbs',
    defaultLayout: 'layout_main',
    layoutsDir: join(__dirname, '../../..', 'views', 'layouts'),
    partialsDir: join(__dirname, '../../..', 'views', 'partials'),
    helpers: helpers,
  });

  app.set('views', join(__dirname, '../../..', 'views'));

  app.engine('hbs', hbs.engine);

  app.setViewEngine('hbs');

  await app.listen(3002);
}
bootstrap();
