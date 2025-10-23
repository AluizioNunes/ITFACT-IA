import { Module } from '@nestjs/common';
import { QueueService } from './queue.service.js';
import { QueueController } from './queue.controller.js';

@Module({
  providers: [QueueService],
  controllers: [QueueController],
  exports: [QueueService],
})
export class QueueModule {}