/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';
import { RobotsService } from '../src/robots/robots.service';
import { RobotHistory } from '../src/robots/robot-history.entity';
import { Facing } from '../src/robots/facing.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RotateDirection } from '../src/robots/dto/robot-movement.dto';
import { Robot } from '../src/robots/robot.entity';

describe('RobotsService - place()', () => {
  let service: RobotsService;
  let qr: QueryRunner;
  let ds: DataSource;
  let fakeManager: EntityManager;

  beforeEach(async () => {
    fakeManager = {
      create: jest.fn().mockImplementation((cls, props) => props),
      save: jest.fn().mockImplementation((entity) => {
        return Promise.resolve({ ...entity, id: 'test-id' });
      }),
      insert: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn(),
    } as unknown as EntityManager;

    qr = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: fakeManager,
    } as unknown as QueryRunner;

    ds = { createQueryRunner: () => qr } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RobotsService, { provide: DataSource, useValue: ds }],
    }).compile();

    service = module.get<RobotsService>(RobotsService);
  });

  it('should place a robot and commit transaction when coords are valid', async () => {
    const result = await service.place(1, 2);

    expect(qr.connect).toHaveBeenCalled();
    expect(qr.startTransaction).toHaveBeenCalled();
    expect(fakeManager.save).toHaveBeenCalledWith(
      expect.objectContaining({ x: 1, y: 2, facing: Facing.NORTH }),
    );
    expect(fakeManager.insert).toHaveBeenCalledWith(
      RobotHistory,
      expect.objectContaining({ x: 1, y: 2, facing: Facing.NORTH }),
    );
    expect(qr.commitTransaction).toHaveBeenCalled();
    expect(qr.rollbackTransaction).not.toHaveBeenCalled();

    expect(result).toMatchObject({ x: 1, y: 2, facing: Facing.NORTH });
  });

  it('should rollback and throw BadRequestException when coords are out of bounds', async () => {
    await expect(service.place(-1, 0)).rejects.toBeInstanceOf(BadRequestException);
    expect(qr.rollbackTransaction).toHaveBeenCalled();
    expect(qr.commitTransaction).not.toHaveBeenCalled();

    (qr.rollbackTransaction as jest.Mock).mockClear();
    (qr.commitTransaction as jest.Mock).mockClear();

    await expect(service.place(6, 3)).rejects.toBeInstanceOf(BadRequestException);
    expect(qr.rollbackTransaction).toHaveBeenCalled();
    expect(qr.commitTransaction).not.toHaveBeenCalled();
  });

  it('should allow placement on a larger board when custom maxX/maxY are provided', async () => {
    const result = await service.place(9, 9, 9, 9);

    expect(qr.connect).toHaveBeenCalled();
    expect(qr.startTransaction).toHaveBeenCalled();
 // Assert save recorded correct dynamic limits
    expect(fakeManager.save).toHaveBeenCalledWith(
      expect.objectContaining({ x: 9, y: 9, facing: Facing.NORTH, maxX: 9, maxY: 9 }),
    );
    expect(fakeManager.insert).toHaveBeenCalledWith(
      RobotHistory,
      expect.objectContaining({ x: 9, y: 9, facing: Facing.NORTH }),
    );
 // Assert committed, not rolled back
    expect(qr.commitTransaction).toHaveBeenCalled();
    expect(qr.rollbackTransaction).not.toHaveBeenCalled();

    expect(result).toMatchObject({ x: 9, y: 9, facing: Facing.NORTH });
  });

  it('should always face NORTH when placed at any coordinates', async () => {
    const result = await service.place(3, 1);

    expect(fakeManager.save).toHaveBeenCalledWith(
      expect.objectContaining({ x: 3, y: 1, facing: Facing.NORTH }),
    );
    expect(result).toBeDefined();
    expect(result!.facing).toBe(Facing.NORTH);
  });
});

describe('RobotsService - move()', () => {
  let service: RobotsService;
  let qr: QueryRunner;
  let ds: DataSource;
  let fakeManager: EntityManager;

  beforeEach(async () => {
    fakeManager = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
    } as unknown as EntityManager;

    qr = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: fakeManager,
    } as unknown as QueryRunner;

    ds = { createQueryRunner: () => qr } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RobotsService,
        { provide: DataSource, useValue: ds },
      ],
    }).compile();

    service = module.get<RobotsService>(RobotsService);
  });

  it('should rollback and throw BadRequestException when moving off grid at west edge', async () => {
    (fakeManager.findOne as jest.Mock).mockResolvedValue({
      id: 'test-id',
      x: 0,
      y: 3,
      facing: Facing.WEST,
      maxX: 4,
      maxY: 4,
    });

    await expect(service.move('test-id')).rejects.toBeInstanceOf(BadRequestException);
    expect(qr.rollbackTransaction).toHaveBeenCalled();
    expect(qr.commitTransaction).not.toHaveBeenCalled();
  });

  it('should move robot north and commit transaction when move is valid', async () => {
    (fakeManager.findOne as jest.Mock).mockResolvedValue({
      id: 'test-id',
      x: 2,
      y: 2,
      facing: Facing.NORTH,
      maxX: 4,
      maxY: 4,
    });

    const result = await service.move('test-id');

    expect(qr.connect).toHaveBeenCalled();
    expect(qr.startTransaction).toHaveBeenCalled();

    expect(fakeManager.update).toHaveBeenCalledWith(
      expect.any(Function),
      { id: 'test-id' },
      { x: 2, y: 3, facing: Facing.NORTH },
    );
    expect(fakeManager.insert).toHaveBeenCalledWith(
      RobotHistory,
      expect.objectContaining({ robot: { id: 'test-id' }, x: 2, y: 3, facing: Facing.NORTH }),
    );

    expect(qr.commitTransaction).toHaveBeenCalled();
    expect(qr.rollbackTransaction).not.toHaveBeenCalled();

    expect(result).toMatchObject({ id: 'test-id', x: 2, y: 3, facing: Facing.NORTH });
  });

  describe('RobotsService - report()', () => {
    let service: RobotsService;
    let qr: QueryRunner;
    let ds: DataSource;
    let fakeManager: EntityManager;

    beforeEach(async () => {
      fakeManager = { findOne: jest.fn() } as unknown as EntityManager;
      qr = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: fakeManager,
      } as unknown as QueryRunner;
      ds = { createQueryRunner: () => qr } as unknown as DataSource;
      const module: TestingModule = await Test.createTestingModule({
        providers: [RobotsService, { provide: DataSource, useValue: ds }],
      }).compile();
      service = module.get<RobotsService>(RobotsService);
    });

    it('should return current robot state when found', async () => {
      const data = { x: 4, y: 3, facing: Facing.WEST };
      (fakeManager.findOne as jest.Mock).mockResolvedValue(data);
      const result = await service.report('rid');
      expect(result).toEqual(data);
      expect(qr.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when no robot with the given ID exists', async () => {
      (fakeManager.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.report('rid')).rejects.toBeInstanceOf(BadRequestException);
      expect(qr.release).toHaveBeenCalled();
    });
  });
});

describe('RobotsService - rotate()', () => {
  let service: RobotsService;
  let qr: QueryRunner;
  let ds: DataSource;
  let fakeManager: EntityManager;

  beforeEach(async () => {
    fakeManager = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
    } as unknown as EntityManager;

    qr = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: fakeManager,
    } as unknown as QueryRunner;

    ds = { createQueryRunner: () => qr } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RobotsService,
        { provide: DataSource, useValue: ds },
      ],
    }).compile();

    service = module.get<RobotsService>(RobotsService);
  });

  it('should update facing, insert history & commit for a RIGHT rotation', async () => {
    (fakeManager.findOne as jest.Mock).mockResolvedValue({
      id: 'r1', x: 1, y: 1, facing: Facing.NORTH, maxX: 4, maxY: 4,
    });

    const updated = await service.rotate('r1', RotateDirection.RIGHT);

    expect(qr.connect).toHaveBeenCalled();
    expect(qr.startTransaction).toHaveBeenCalled();

    expect(fakeManager.update).toHaveBeenCalledWith(
      Robot,
      { id: 'r1' },
      { facing: Facing.EAST },
    );
    expect(fakeManager.insert).toHaveBeenCalledWith(
      RobotHistory,
      { robot: { id: 'r1' }, x: 1, y: 1, facing: Facing.EAST },
    );

    expect(qr.commitTransaction).toHaveBeenCalled();
    expect(qr.rollbackTransaction).not.toHaveBeenCalled();

    expect(updated.facing).toBe(Facing.EAST);
  });

  const rotationCases: Array<[Facing, RotateDirection, Facing]> = [
    [Facing.NORTH, RotateDirection.LEFT, Facing.WEST],
    [Facing.NORTH, RotateDirection.RIGHT, Facing.EAST],
    [Facing.EAST, RotateDirection.LEFT, Facing.NORTH],
    [Facing.EAST, RotateDirection.RIGHT, Facing.SOUTH],
    [Facing.SOUTH, RotateDirection.LEFT, Facing.EAST],
    [Facing.SOUTH, RotateDirection.RIGHT, Facing.WEST],
    [Facing.WEST, RotateDirection.LEFT, Facing.SOUTH],
    [Facing.WEST, RotateDirection.RIGHT, Facing.NORTH],
  ];
  rotationCases.forEach(([start, turn, expected]) => {
    it(`should rotate ${start} ${turn} to ${expected}`, async () => {
      (fakeManager.findOne as jest.Mock).mockResolvedValue({
        id: 'r2', x: 5, y: 5, facing: start, maxX: 10, maxY: 10,
      });
      const updated = await service.rotate('r2', turn);
      expect(fakeManager.update).toHaveBeenCalledWith(
        Robot,
        { id: 'r2' },
        { facing: expected },
      );
      expect(fakeManager.insert).toHaveBeenCalledWith(
        RobotHistory,
        { robot: { id: 'r2' }, x: 5, y: 5, facing: expected },
      );
      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(qr.rollbackTransaction).not.toHaveBeenCalled();
      expect(updated.facing).toBe(expected);
      (fakeManager.update as jest.Mock).mockClear();
      (fakeManager.insert as jest.Mock).mockClear();
      (qr.commitTransaction as jest.Mock).mockClear();
    });
  });
});

describe('RobotsService - place->rotate->move sequence', () => {
  let service: RobotsService;
  let qr: QueryRunner;
  let ds: DataSource;
  let fakeManager: EntityManager;

  beforeEach(async () => {
    fakeManager = {
      create: jest.fn().mockImplementation((cls, props) => props),
      save: jest.fn().mockImplementation(entity => Promise.resolve({ ...entity, id: 'seq-id' })),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
    } as unknown as EntityManager;

    qr = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: fakeManager,
    } as unknown as QueryRunner;

    ds = { createQueryRunner: () => qr } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RobotsService, { provide: DataSource, useValue: ds }],
    }).compile();

    service = module.get<RobotsService>(RobotsService);
  });

  it('should correctly place, rotate right, move forward and record history', async () => {
    (fakeManager.findOne as jest.Mock)
      .mockResolvedValueOnce({ id: 'seq-id', x: 1, y: 1, facing: Facing.NORTH, maxX: 4, maxY: 4 })
      .mockResolvedValueOnce({ id: 'seq-id', x: 1, y: 1, facing: Facing.EAST,  maxX: 4, maxY: 4 });

    const placed  = await service.place(1, 1);
    expect(placed).toMatchObject({ id: 'seq-id', x: 1, y: 1, facing: Facing.NORTH });

    const rotated = await service.rotate('seq-id', RotateDirection.RIGHT);
    expect(rotated.facing).toBe(Facing.EAST);

    const moved   = await service.move('seq-id');
    expect(moved).toMatchObject({ id: 'seq-id', x: 2, y: 1, facing: Facing.EAST });

    expect(fakeManager.insert).toHaveBeenCalledTimes(3);
    expect(fakeManager.insert).toHaveBeenNthCalledWith(1, RobotHistory,
      expect.objectContaining({ robot: { id: 'seq-id' }, x: 1, y: 1, facing: Facing.NORTH }),
    );
    expect(fakeManager.insert).toHaveBeenNthCalledWith(2, RobotHistory,
      expect.objectContaining({ robot: { id: 'seq-id' }, x: 1, y: 1, facing: Facing.EAST  }),
    );
    expect(fakeManager.insert).toHaveBeenNthCalledWith(3, RobotHistory,
      expect.objectContaining({ robot: { id: 'seq-id' }, x: 2, y: 1, facing: Facing.EAST  }),
    );

    expect(qr.commitTransaction).toHaveBeenCalledTimes(3);

    (fakeManager.findOne as jest.Mock).mockResolvedValue({ x: 2, y: 1, facing: Facing.EAST });
    const reported = await service.report('seq-id');
    expect(reported).toEqual({ x: 2, y: 1, facing: Facing.EAST });
    expect(qr.release).toHaveBeenCalled();
  });
});

describe('RobotsService - getHistory()', () => {
  let service: RobotsService;
  let qr: QueryRunner;
  let ds: DataSource;
  let fakeManager: EntityManager;

  beforeEach(async () => {
    fakeManager = { find: jest.fn() } as unknown as EntityManager;
    qr = { connect: jest.fn(), manager: fakeManager, release: jest.fn() } as unknown as QueryRunner;
    ds = { createQueryRunner: () => qr } as unknown as DataSource;
    const module: TestingModule = await Test.createTestingModule({
      providers: [RobotsService, { provide: DataSource, useValue: ds }],
    }).compile();
    service = module.get<RobotsService>(RobotsService);
  });

  it('should return history entries ordered by timestamp', async () => {
    const mockHistory = [
      { x: 1, y: 2, facing: Facing.NORTH, timestamp: new Date('2020-01-01') },
      { x: 2, y: 3, facing: Facing.EAST, timestamp: new Date('2020-01-02') },
    ];
    (fakeManager.find as jest.Mock).mockResolvedValue(mockHistory);
    const result = await service.getHistory('rid');
    expect(qr.connect).toHaveBeenCalled();
    expect(fakeManager.find).toHaveBeenCalledWith(RobotHistory, {
      where: { robot: { id: 'rid' } },
      order: { timestamp: 'ASC' },
    });
    expect(qr.release).toHaveBeenCalled();
    expect(result).toEqual(mockHistory);
  });

  it('should return empty array when no history exists', async () => {
    (fakeManager.find as jest.Mock).mockResolvedValue([]);
    const result = await service.getHistory('rid');
    expect(result).toEqual([]);
    expect(qr.release).toHaveBeenCalled();
  });
});
