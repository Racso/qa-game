import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';
import { Activity } from './entities/activity.entity.js';
import { Question } from './entities/question.entity.js';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
  ) {}

  async findAll(): Promise<Activity[]> {
    return this.activityRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.activityRepo.findOneBy({ id });
    if (!activity) throw new NotFoundException(`Activity ${id} not found`);
    // Sort questions by order
    activity.questions.sort((a, b) => a.order - b.order);
    return activity;
  }

  async create(dto: CreateActivityDto): Promise<Activity> {
    const activity = this.activityRepo.create({
      title: dto.title,
      questions: dto.questions.map((q, i) =>
        this.questionRepo.create({ ...q, order: i }),
      ),
    });
    return this.activityRepo.save(activity);
  }

  async update(id: string, dto: UpdateActivityDto): Promise<Activity> {
    const activity = await this.findOne(id);

    if (dto.title !== undefined) {
      activity.title = dto.title;
    }

    if (dto.questions !== undefined) {
      // Replace all questions atomically
      await this.questionRepo.delete({ activity: { id } });
      activity.questions = dto.questions.map((q, i) =>
        this.questionRepo.create({ ...q, order: i }),
      );
    }

    return this.activityRepo.save(activity);
  }

  async remove(id: string): Promise<void> {
    const activity = await this.findOne(id);
    await this.activityRepo.remove(activity);
  }
}
