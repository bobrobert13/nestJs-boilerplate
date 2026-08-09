import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BunnyStorageService } from './services/bunny-storage.service';
import bunnyConfig from './config/bunny.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(bunnyConfig)],
  providers: [BunnyStorageService],
  exports: [BunnyStorageService],
})
export class BunnyModule {}
