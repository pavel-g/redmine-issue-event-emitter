import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataLoaderService } from './data-loaders/data-loader/data-loader.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, DataLoaderService],
})
export class AppModule {}
