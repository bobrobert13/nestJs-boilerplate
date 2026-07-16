import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import {
  NewsletterSubscriber,
  NewsletterSubscriberSchema,
} from '../../schemas/newsletter-subscriber.schema';
import { ResendModule } from '../../resend.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewsletterSubscriber.name, schema: NewsletterSubscriberSchema },
    ]),
    ResendModule,
  ],
  controllers: [NewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}