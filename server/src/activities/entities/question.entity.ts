import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './activity.entity.js';

@Entity()
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  text!: string;

  @Column({ type: 'simple-json' })
  options!: string[];

  @Column()
  correctIndex!: number;

  @Column({ default: 20 })
  timeLimitSeconds!: number;

  @Column({ default: 0 })
  order!: number;

  @ManyToOne(() => Activity, (a) => a.questions, { onDelete: 'CASCADE' })
  activity!: Activity;
}
