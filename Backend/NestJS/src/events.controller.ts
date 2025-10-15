import { Controller, Sse } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { interval, map } from 'rxjs';

@ApiTags('events')
@Controller('events')
export class EventsController {
  @Sse('metrics')
  metricsStream(): Observable<MessageEvent> {
    return interval(5000).pipe(
      map(() => ({
        data: JSON.stringify({ timestamp: Date.now(), latency: Math.round(Math.random() * 200) }),
      }) as any),
    );
  }
}