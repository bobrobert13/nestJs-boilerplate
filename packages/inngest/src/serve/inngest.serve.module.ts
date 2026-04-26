import { Module } from '@nestjs/common';
import { InngestModule } from '../inngest.module';
import { InngestEventsController } from './inngest-events.controller';

@Module({
  imports: [InngestModule],
  controllers: [InngestEventsController],
})
export class InngestServeModule {}
