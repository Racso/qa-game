import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesController } from './activities.controller.js';
import { ActivitiesService } from './activities.service.js';
import { Activity } from './entities/activity.entity.js';
import { Question } from './entities/question.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, Question])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
