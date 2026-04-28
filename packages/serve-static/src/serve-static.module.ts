import { Module, Global } from '@nestjs/common';
import { ServeStaticService } from './serve-static.service';

@Global()
@Module({
  providers: [ServeStaticService],
  exports: [ServeStaticService],
})
export class ServeStaticModule {}
