import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RobotsController } from '../src/robots/robots.controller';
import { RobotsService } from '../src/robots/robots.service';
import {
  PlaceRobotDto,
  RotateRobotDto,
  RotateDirection,
} from '../src/robots/dto/robot-movement.dto';

describe('RobotsController', () => {
  let controller: RobotsController;
  let service: Partial<RobotsService>;

  beforeEach(async () => {
    const mockService: Partial<RobotsService> = {
      place: jest.fn(),
      rotate: jest.fn(),
      move: jest.fn(),
      report: jest.fn(),
      getHistory: jest.fn(),
    };
    service = mockService;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RobotsController],
      providers: [{ provide: RobotsService, useValue: service }],
    }).compile();

    controller = module.get<RobotsController>(RobotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('place()', () => {
    it('should call service.place and return its result', async () => {
      const dto: PlaceRobotDto = { x: 1, y: 2 };
      const mockRobot = { id: 'r1', x: 1, y: 2, facing: 'NORTH' };
      (service.place as jest.Mock).mockResolvedValue(mockRobot);

      const result = await controller.place(dto);
      expect(service.place).toHaveBeenCalledWith(
        dto.x,
        dto.y,
        dto.maxX,
        dto.maxY,
      );
      expect(result).toBe(mockRobot);
    });

    it('should propagate a BadRequestException from the service', async () => {
      (service.place as jest.Mock).mockRejectedValue(new BadRequestException());
      const invalidDto: PlaceRobotDto = { x: -1, y: 0 };
      await expect(controller.place(invalidDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('rotate()', () => {
    it('should call service.rotate and return its result', async () => {
      const dto: RotateRobotDto = {
        robot_id: 'r1',
        direction: RotateDirection.LEFT,
      };
      const mockRobot = { id: 'r1', facing: 'WEST' };
      (service.rotate as jest.Mock).mockResolvedValue(mockRobot);

      const result = await controller.rotate(dto);
      expect(service.rotate).toHaveBeenCalledWith(dto.robot_id, dto.direction);
      expect(result).toBe(mockRobot);
    });

    it('should propagate service errors', async () => {
      (service.rotate as jest.Mock).mockRejectedValue(
        new BadRequestException(),
      );
      await expect(
        controller.rotate({
          robot_id: 'r1',
          direction: RotateDirection.RIGHT,
        } as RotateRobotDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('move()', () => {
    it('should call service.move and return its result', async () => {
      const id = 'r1';
      const mockRobot = { id, x: 2, y: 3, facing: 'NORTH' };
      (service.move as jest.Mock).mockResolvedValue(mockRobot);

      const result = await controller.move(id);

      expect(service.move).toHaveBeenCalledWith(id);
      expect(result).toBe(mockRobot);
    });

    it('should propagate service errors for move', async () => {
      const id = 'r1';
      (service.move as jest.Mock).mockRejectedValue(new BadRequestException());
      await expect(controller.move(id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('report()', () => {
    it('should call service.report and return its result', async () => {
      const id = 'r1';
      const mockReport = { x: 2, y: 3, facing: 'NORTH' };
      (service.report as jest.Mock).mockResolvedValue(mockReport);

      const result = await controller.report(id);
      expect(service.report).toHaveBeenCalledWith(id);
      expect(result).toBe(mockReport);
    });

    it('should propagate service errors', async () => {
      const id = 'r1';
      (service.report as jest.Mock).mockRejectedValue(
        new BadRequestException(),
      );
      await expect(controller.report(id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getHistory()', () => {
    it('should call service.getHistory and return its result', async () => {
      const id = 'r1';
      const mockHistory = [{ x: 1, y: 2, facing: 'NORTH' }];
      (service.getHistory as jest.Mock).mockResolvedValue(mockHistory);

      const result = await controller.getHistory(id);
      expect(service.getHistory).toHaveBeenCalledWith(id);
      expect(result).toBe(mockHistory);
    });

    it('should throw BadRequestException when no history exists', async () => {
      const id = 'r1';
      (service.getHistory as jest.Mock).mockResolvedValue([]);
      await expect(controller.getHistory(id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
