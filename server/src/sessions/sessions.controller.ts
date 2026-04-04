import { Body, Controller, Get, HttpCode, MessageEvent, Param, Post, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { JoinSessionDto } from './dto/join-session.dto.js';
import { SubmitAnswerDto } from './dto/submit-answer.dto.js';
import { SessionsService } from './sessions.service.js';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /** Teacher creates a session for an activity */
  @Post()
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  /** Get current session state (useful for reconnection) */
  @Get(':code')
  getState(@Param('code') code: string) {
    return this.sessionsService.getState(code);
  }

  /** SSE stream — all clients subscribe here */
  @Sse(':code/events')
  events(@Param('code') code: string): Observable<MessageEvent> {
    return this.sessionsService.getEventStream(code) as Observable<MessageEvent>;
  }

  /** Student joins the lobby */
  @Post(':code/join')
  join(@Param('code') code: string, @Body() dto: JoinSessionDto) {
    return this.sessionsService.join(code, dto);
  }

  /** Teacher starts the game */
  @Post(':code/start')
  @HttpCode(200)
  start(@Param('code') code: string) {
    this.sessionsService.start(code);
    return { ok: true };
  }

  /** Student submits an answer */
  @Post(':code/answer')
  @HttpCode(200)
  submitAnswer(@Param('code') code: string, @Body() dto: SubmitAnswerDto) {
    this.sessionsService.submitAnswer(code, dto);
    return { ok: true };
  }

  /** Teacher advances to next question (or ends game) */
  @Post(':code/next')
  @HttpCode(200)
  next(@Param('code') code: string) {
    this.sessionsService.next(code);
    return { ok: true };
  }

  /** Final results (available after game ends) */
  @Get(':code/results')
  results(@Param('code') code: string) {
    return this.sessionsService.getResults(code);
  }
}
