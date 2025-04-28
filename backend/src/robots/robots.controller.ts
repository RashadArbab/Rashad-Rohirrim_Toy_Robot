import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { RobotsService } from './robots.service';
import { PlaceRobotDto, RotateRobotDto } from './dto/robot-movement.dto';

@Controller('robots')
export class RobotsController {
  constructor(private readonly robotsService: RobotsService) {}

  @Post('place')
  async place(@Body() placeRobotDto: PlaceRobotDto) {
    return this.robotsService.place(
      placeRobotDto.x,
      placeRobotDto.y,
      placeRobotDto.maxX,
      placeRobotDto.maxY,
    );
  }

  @Post('rotate')
  async rotate(@Body() rotateRobotDto: RotateRobotDto) {
    return this.robotsService.rotate(
      rotateRobotDto.robot_id,
      rotateRobotDto.direction,
    );
  }

  @Post('move/:robot_id')
  async move(@Param('robot_id') robot_id: string) {
    return this.robotsService.move(robot_id);
  }

  @Get('report/:robot_id')
  async report(@Param('robot_id') robot_id: string) {
    return this.robotsService.report(robot_id);
  }

  @Get('history/:robot_id')
  async getHistory(@Param('robot_id') robot_id: string) {
    const history = await this.robotsService.getHistory(robot_id);
    if (history.length === 0) {
      throw new BadRequestException('No history for robot');
    }
    return history;
  }
}
