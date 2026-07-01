import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import type { SubscribeDto, UnsubscribeDto } from './interfaces/newsletter.interfaces';

/**
 * REST controller for newsletter subscription management.
 * Exposes endpoints for subscribing, unsubscribing, listing subscribers, and stats.
 */
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(@Body() dto: SubscribeDto) {
    const subscriber = await this.newsletterService.subscribe(dto);
    return {
      success: true,
      data: subscriber,
    };
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    await this.newsletterService.unsubscribe(dto);
    return {
      success: true,
      message: 'Unsubscribed successfully',
    };
  }

  @Get('subscribers')
  async getSubscribers() {
    const subscribers = this.newsletterService.getSubscribers();
    return {
      success: true,
      data: subscribers,
      count: subscribers.length,
    };
  }

  @Get('stats')
  async getStats() {
    const active = this.newsletterService.getSubscriberCount(true);
    const total = this.newsletterService.getSubscriberCount(false);
    return {
      success: true,
      data: { active, total },
    };
  }

  @Delete('subscribers/:email')
  async removeSubscriber(@Body('email') email: string) {
    await this.newsletterService.unsubscribe({ email, reason: 'manual_removal' });
    return {
      success: true,
      message: 'Subscriber removed',
    };
  }
}