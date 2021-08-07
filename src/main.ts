import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = "0";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env['PORT'] || 3000);
}
bootstrap();
