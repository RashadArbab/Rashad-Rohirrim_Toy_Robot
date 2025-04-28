import { Module } from '@nestjs/common';
import { RobotsController } from './robots.controller';
import { RobotsService } from './robots.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Robot } from './robot.entity';
import { RobotHistory } from './robot-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Robot, RobotHistory])],
  controllers: [RobotsController],
  providers: [RobotsService],
})
export class RobotsModule {}
