import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

/**
 * Global cron infrastructure.
 * Imports {@link ScheduleModule.forRoot} so every module can use {@link Cron},
 * {@link Interval} and {@link Timeout} decorators without importing this module.
 */
@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
})
export class CronModule {}
