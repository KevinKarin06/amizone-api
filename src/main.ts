import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const corsOption = {
    origin: '*',
    allowedHeaders: '*',
  };
  app.enableCors(corsOption);

  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`Server is running on: ${await app.getUrl()}`);
}
bootstrap();
