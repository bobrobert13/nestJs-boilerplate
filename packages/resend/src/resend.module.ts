import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResendService } from './services/resend.service';
import resendConfig from './config/resend.config';

/**
 * NestJS global module for the Resend email service.
 * Provides ResendService application-wide without requiring explicit imports.
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(resendConfig)],
  providers: [ResendService],
  exports: [ResendService],
})
export class ResendModule {}