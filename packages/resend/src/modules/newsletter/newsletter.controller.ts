import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import type { SubscribeDto, UnsubscribeDto } from './interfaces/newsletter.interfaces';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe an email to the newsletter' })
  @ApiResponse({ status: 200, description: 'Successfully subscribed' })
  @ApiResponse({ status: 409, description: 'Already subscribed' })
  async subscribe(@Body() dto: SubscribeDto) {
    const subscriber = await this.newsletterService.subscribe(dto);
    return {
      success: true,
      data: subscriber,
    };
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe an email from the newsletter' })
  @ApiResponse({ status: 200, description: 'Successfully unsubscribed' })
  @ApiResponse({ status: 404, description: 'Subscriber not found' })
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    await this.newsletterService.unsubscribe(dto);
    return {
      success: true,
      message: 'Unsubscribed successfully',
    };
  }

  @Get('subscribers')
  @ApiOperation({ summary: 'List all newsletter subscribers' })
  @ApiResponse({ status: 200, description: 'List of subscribers with count' })
  async getSubscribers() {
    const subscribers = this.newsletterService.getSubscribers();
    return {
      success: true,
      data: subscribers,
      count: subscribers.length,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get newsletter subscription statistics' })
  @ApiResponse({ status: 200, description: 'Active and total subscriber counts' })
  async getStats() {
    const active = this.newsletterService.getSubscriberCount(true);
    const total = this.newsletterService.getSubscriberCount(false);
    return {
      success: true,
      data: { active, total },
    };
  }

  @Delete('subscribers/:email')
  @ApiOperation({ summary: 'Remove a subscriber by email' })
  @ApiResponse({ status: 200, description: 'Subscriber removed' })
  async removeSubscriber(@Body('email') email: string) {
    await this.newsletterService.unsubscribe({ email, reason: 'manual_removal' });
    return {
      success: true,
      message: 'Subscriber removed',
    };
  }
}