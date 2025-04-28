import { IsInt, IsOptional, Min, IsString, IsEnum } from 'class-validator';

export class PlaceRobotDto {
  @IsInt()
  @Min(0)
  x: number;

  @IsInt()
  @Min(0)
  y: number;

  @IsOptional() @IsInt() @Min(0) maxX?: number;
  @IsOptional() @IsInt() @Min(0) maxY?: number;
}

export enum RotateDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export class RotateRobotDto {
  @IsString()
  robot_id: string;

  @IsEnum(RotateDirection, {
    message: 'direction must be either LEFT or RIGHT',
  })
  direction: RotateDirection;
}

export class MoveRobotDto {
  @IsString()
  robot_id: string;
}

// this is a bit overbuilding, since its the same as move robot but if i wanted to change one
// without changing the other i could do so later without needing to change more code.
export class ReportRobotDto {
  @IsString()
  robot_id: string;
}
