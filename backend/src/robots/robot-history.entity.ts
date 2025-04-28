import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Robot } from './robot.entity';
import { Facing } from './facing.enum';

@Entity()
export class RobotHistory {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Robot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'robot_id' })
  robot: Robot;
  @Column('int') x: number;
  @Column('int') y: number;
  @Column({ type: 'text', enum: Facing }) facing: Facing;
  @CreateDateColumn() timestamp: Date;
}
