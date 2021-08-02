import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedmineEventsGateway } from './events/redmine-events.gateway';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import MainConfig from './configs/main-config';
import { ConfigModule } from '@nestjs/config';
import { RedmineDataLoader } from './redmine-data-loader/redmine-data-loader';

@Module({
  imports: [
    ServeStaticModule.forRoot({rootPath: join(__dirname, '..', 'client')}),
    ConfigModule.forRoot({load: [MainConfig]})
  ],
  controllers: [AppController],
  providers: [AppService, RedmineEventsGateway, RedmineDataLoader],
})
export class AppModule {}
