import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RobotsModule } from './robots/robots.module';
import { AppDataSource } from './data-source';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(AppDataSource.options), RobotsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
