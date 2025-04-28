import { BadRequestException, Injectable } from '@nestjs/common';
import { Robot } from './robot.entity';
import { RobotHistory } from './robot-history.entity';
import { RotateDirection } from './dto/robot-movement.dto';
import { DataSource } from 'typeorm';
import { Facing } from './facing.enum';
@Injectable()
export class RobotsService {
  constructor(private readonly dataSource: DataSource) {}

  async place(
    x: number,
    y: number,
    maxX?: number,
    maxY?: number,
  ): Promise<Robot | undefined> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const DEFAULT_MAX = 4;
      const boardMaxY = maxY ?? DEFAULT_MAX;
      const boardMaxX = maxX ?? DEFAULT_MAX;

      if (x < 0 || x > boardMaxX || y < 0 || y > boardMaxY) {
        throw new BadRequestException(
          `Coordinates must be between 0 and (${boardMaxX}, ${boardMaxY})`,
        );
      }

      // create the robot
      let robot = qr.manager.create(Robot, {
        x,
        y,
        facing: Facing.NORTH,
        maxX: boardMaxX,
        maxY: boardMaxY,
      });
      robot = await qr.manager.save(robot);

      // insert into history
      await qr.manager.insert(RobotHistory, {
        robot: { id: robot.id },
        x: robot.x,
        y: robot.y,
        facing: robot.facing,
      });

      await qr.commitTransaction();
      return robot;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // this is a helper to rotate the robot, i could have used a more complicated solution using a loop based on where its facing and the new direction
  // but this will be faster. i need this to run fast.
  private rotateFacing(facing: Facing, direction: RotateDirection): Facing {
    switch (direction) {
      case RotateDirection.LEFT:
        switch (facing) {
          case Facing.NORTH:
            return Facing.WEST;
          case Facing.WEST:
            return Facing.SOUTH;
          case Facing.SOUTH:
            return Facing.EAST;
          case Facing.EAST:
            return Facing.NORTH;
        }
        break;
      case RotateDirection.RIGHT:
        switch (facing) {
          case Facing.NORTH:
            return Facing.EAST;
          case Facing.EAST:
            return Facing.SOUTH;
          case Facing.SOUTH:
            return Facing.WEST;
          case Facing.WEST:
            return Facing.NORTH;
        }
        break;
    }
    // fallback (should never happen)
    return facing;
  }
  async rotate(robot_id: string, direction: RotateDirection) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const robot = await qr.manager.findOne(Robot, {
        where: { id: robot_id },
      });

      if (!robot) {
        throw new BadRequestException('Robot not found');
      }

      const newFacing = this.rotateFacing(robot.facing, direction);

      await qr.manager.update(Robot, { id: robot_id }, { facing: newFacing });
      // in the instructions it says that the robot history should be updated when the robot moves,
      // it doesnt clarify if a rotation is a move or not but I want the direction of the robot to be consistent in its history
      // and the current direction of the robot. additionally if i want a play back of how the robot moved i want to show the rotations.
      // hence i am updating the history with the rotation.
      await qr.manager.insert(RobotHistory, {
        robot: { id: robot_id },
        x: robot.x,
        y: robot.y,
        facing: newFacing,
      });

      await qr.commitTransaction();
      // after the db has been updated I want to update the robot in memory and return it.
      // this is safe since the transaction is complete and saves me looking up in the db again.
      robot.facing = newFacing;
      return robot;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async move(robot_id: string) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const robot = await qr.manager.findOne(Robot, {
        where: { id: robot_id },
      });

      if (!robot) {
        return new BadRequestException('Robot not found');
      }

      if (robot.facing === Facing.NORTH) {
        if (robot.y + 1 > robot.maxY) {
          throw new BadRequestException('Cannot move robot off the board');
        }
        robot.y += 1;
        robot.facing = Facing.NORTH;
      } else if (robot.facing === Facing.SOUTH) {
        if (robot.y - 1 < 0) {
          throw new BadRequestException('Cannot move robot off the board');
        }
        robot.y -= 1;
        robot.facing = Facing.SOUTH;
      } else if (robot.facing === Facing.EAST) {
        if (robot.x + 1 > robot.maxX) {
          throw new BadRequestException('Cannot move robot off the board');
        }
        robot.x += 1;
        robot.facing = Facing.EAST;
      } else if (robot.facing === Facing.WEST) {
        if (robot.x - 1 < 0) {
          throw new BadRequestException('Cannot move robot off the board');
        }
        robot.x -= 1;
        robot.facing = Facing.WEST;
      }

      await qr.manager.update(
        Robot,
        { id: robot_id },
        { x: robot.x, y: robot.y, facing: robot.facing },
      );

      await qr.manager.insert(RobotHistory, {
        robot: { id: robot_id },
        x: robot.x,
        y: robot.y,
        facing: robot.facing,
      });

      await qr.commitTransaction();
      return robot;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async report(robot_id: string) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const robot = await qr.manager.findOne(Robot, {
        where: { id: robot_id },
      });

      if (!robot) {
        throw new BadRequestException('Robot not found');
      }

      return robot;
    } finally {
      await qr.release();
    }
  }

  async getHistory(robot_id: string): Promise<RobotHistory[]> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    try {
      return await qr.manager.find(RobotHistory, {
        where: { robot: { id: robot_id } },
        order: { timestamp: 'ASC' },
      });
    } finally {
      await qr.release();
    }
  }
}
