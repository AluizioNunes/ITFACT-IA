import { Body, Controller, Post } from '@nestjs/common';
import { QueueService } from './queue.service.js';

@Controller('queue')
export class QueueController {
  constructor(private readonly svc: QueueService) {}

  @Post('fping')
  async fping(@Body() body: { hosts: string[]; count?: number; interval_ms?: number }) {
    const job = await this.svc.enqueueFping(body);
    return { jobId: job.id };
  }

  @Post('iperf3')
  async iperf3(@Body() body: { server: string; duration?: number; reverse?: boolean }) {
    const job = await this.svc.enqueueIperf3(body);
    return { jobId: job.id };
  }
}