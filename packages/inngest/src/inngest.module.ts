import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InngestService } from './inngest.service';
import { InngestEventsController } from './serve/inngest-events.controller';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [InngestService],
  exports: [InngestService],
  controllers: [InngestEventsController],
})
export class InngestModule {}
