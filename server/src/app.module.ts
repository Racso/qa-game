import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesModule } from './activities/activities.module.js';
import { Activity } from './activities/entities/activity.entity.js';
import { Question } from './activities/entities/question.entity.js';
import { SessionsModule } from './sessions/sessions.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env['DB_PATH'] ?? './data/testaula.sqlite',
      entities: [Activity, Question],
      synchronize: true,
    }),
    ActivitiesModule,
    SessionsModule,
  ],
})
export class AppModule {}
