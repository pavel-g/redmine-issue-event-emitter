import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataLoaderService } from './data-loader/data-loader.service';
import { IssueChangeGateway } from './events/issue-change.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, DataLoaderService, IssueChangeGateway],
})
export class AppModule {}
