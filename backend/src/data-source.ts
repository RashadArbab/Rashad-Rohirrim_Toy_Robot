import { DataSource } from 'typeorm';
import { Robot } from './robots/robot.entity';
import { RobotHistory } from './robots/robot-history.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'data/toyrobot.db',
  entities: [Robot, RobotHistory],
  migrations: [__dirname + '/migrations/*.js'],
  synchronize: false,
  migrationsRun: true,
});
