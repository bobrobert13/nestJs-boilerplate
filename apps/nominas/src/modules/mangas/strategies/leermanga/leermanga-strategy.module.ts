import { Module } from '@nestjs/common';
import { LeermangaStrategy } from './leermanga.strategy';
import { PlaywrightModule } from '@common/playwright';

@Module({
  imports: [PlaywrightModule],
  providers: [LeermangaStrategy],
  exports: [LeermangaStrategy],
})
export class LeermangaStrategyModule {}