import { Module } from '@nestjs/common';
import { ManhwawebStrategy } from './manhwaweb.strategy';
import { HttpModule } from '@common/http';

@Module({
  imports: [HttpModule],
  providers: [ManhwawebStrategy],
  exports: [ManhwawebStrategy],
})
export class ManhwawebStrategyModule {}