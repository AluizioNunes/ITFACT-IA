import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller.js';
import { MetricsController } from './metrics.controller.js';
import { InventoryController } from './inventory.controller.js';
import { EventsController } from './events.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { QueueModule } from './queue/queue.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, QueueModule],
  controllers: [HealthController, MetricsController, InventoryController, EventsController],
  providers: [],
})
export class AppModule {}