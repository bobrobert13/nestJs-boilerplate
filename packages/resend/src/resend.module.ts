import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResendService } from './services/resend.service';
import resendConfig from './config/resend.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(resendConfig)],
  providers: [ResendService],
  exports: [ResendService],
})
export class ResendModule {}
