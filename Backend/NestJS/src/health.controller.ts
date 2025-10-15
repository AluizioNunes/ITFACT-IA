import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  get() {
    return {
      status: 'ok',
      service: 'cmm-core-api',
      ts: new Date().toISOString(),
    };
  }
}