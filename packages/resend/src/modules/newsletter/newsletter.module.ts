import { Module } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { ResendModule } from '../../resend.module';

/**
 * NestJS module for the newsletter feature.
 * Provides subscription management and bulk email sending via Resend.
 */
@Module({
  imports: [ResendModule],
  controllers: [NewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}