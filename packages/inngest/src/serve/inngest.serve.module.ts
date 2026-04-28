import { Module } from '@nestjs/common';
import { InngestModule } from '../inngest.module';
import { InngestEventsController } from './inngest-events.controller';
import { InngestServeController } from './inngest-serve.controller';

@Module({
  imports: [InngestModule],
  controllers: [InngestEventsController, InngestServeController],
})
export class InngestServeModule {}