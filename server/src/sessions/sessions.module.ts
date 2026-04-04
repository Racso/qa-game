import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module.js';
import { SessionsController } from './sessions.controller.js';
import { SessionsService } from './sessions.service.js';

@Module({
  imports: [ActivitiesModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
