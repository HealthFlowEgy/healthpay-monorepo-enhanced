import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { HpFenceModule } from './hp-fence.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { create } from 'express-handlebars';
import helpers from './hp-fence-hbs-helpers';
import { join } from 'path';

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

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(process.env.PORT ?? 3002, '0.0.0.0');

  Logger.verbose(
    '[App] Starting app on url ' + (await app.getUrl()) + '/graphql',
  );
}
bootstrap();
