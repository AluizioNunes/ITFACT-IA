import { Injectable, Logger } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { spawn } from 'child_process';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly queue: Queue;
  private readonly worker: Worker;

  constructor() {
    this.queue = new Queue('network-jobs', { connection: { url: REDIS_URL } });
    this.worker = new Worker('network-jobs', async (job: Job) => {
      if (job.name === 'fping') {
        return await this.runFping(job.data);
      }
      if (job.name === 'iperf3') {
        return await this.runIperf3(job.data);
      }
      throw new Error(`Job desconhecido: ${job.name}`);
    }, { connection: { url: REDIS_URL }, concurrency: 2 });

    this.worker.on('completed', (job, result) => {
      this.logger.log(`Job ${job.id} concluído: ${job.name}`);
    });
    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} falhou: ${job?.name} -> ${err.message}`);
    });
  }

  async enqueueFping(data: { hosts: string[]; count?: number; interval_ms?: number }) {
    return this.queue.add('fping', data, { removeOnComplete: 100, removeOnFail: 100 });
  }
  async enqueueIperf3(data: { server: string; duration?: number; reverse?: boolean }) {
    return this.queue.add('iperf3', data, { removeOnComplete: 100, removeOnFail: 100 });
  }

  private runFping(data: { hosts: string[]; count?: number; interval_ms?: number }): Promise<any> {
    const { hosts, count = 3, interval_ms = 100 } = data;
    return new Promise((resolve, reject) => {
      const args = ['-c', String(count), '-p', String(interval_ms), ...hosts];
      const child = spawn('fping', args);
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.stderr.on('data', (d) => (stderr += d.toString()));
      child.on('close', (code) => {
        if (code === 0 || stdout) {
          resolve({ ok: true, code, stdout, stderr });
        } else {
          reject(new Error(stderr || `fping saiu com código ${code}`));
        }
      });
    });
  }

  private runIperf3(data: { server: string; duration?: number; reverse?: boolean }): Promise<any> {
    const { server, duration = 10, reverse = false } = data;
    return new Promise((resolve, reject) => {
      const args = ['-c', server, '-t', String(duration), '-J'];
      if (reverse) args.push('-R');
      const child = spawn('iperf3', args);
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.stderr.on('data', (d) => (stderr += d.toString()));
      child.on('close', (code) => {
        if (code === 0 || stdout) {
          resolve({ ok: true, code, json: safeJson(stdout), stderr });
        } else {
          reject(new Error(stderr || `iperf3 saiu com código ${code}`));
        }
      });
    });
  }
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return { raw: s };
  }
}