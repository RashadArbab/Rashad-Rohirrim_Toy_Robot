import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Facing } from './facing.enum';

@Entity()
// simple robot entity it has x, y, and facing also the primary key which can be used as a primary key for the board and the robot and history
export class Robot {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('int') x: number;
  @Column('int') y: number;
  @Column({ type: 'text', enum: Facing }) facing: Facing;
  @Column('int', { default: 4 }) maxX: number;
  @Column('int', { default: 4 }) maxY: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
