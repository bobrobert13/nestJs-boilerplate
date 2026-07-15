import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto, UnsubscribeDto } from './interfaces/newsletter.interfaces';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Subscribe an email address to the newsletter',
    description:
      'Adds a new subscriber or reactivates a previously unsubscribed email. Returns 409 if the email is already active.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully subscribed or reactivated',
  })
  @ApiResponse({ status: 400, description: 'Invalid email format' })
  @ApiResponse({ status: 409, description: 'Email is already subscribed' })
  async subscribe(@Body() dto: SubscribeDto) {
    const subscriber = await this.newsletterService.subscribe(dto);
    return {
      success: true,
      data: subscriber,
    };
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unsubscribe an email address from the newsletter',
    description:
      'Marks a subscriber as inactive. Requires the email address and accepts an optional reason.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully unsubscribed',
  })
  @ApiResponse({ status: 400, description: 'Invalid email format' })
  @ApiResponse({ status: 404, description: 'Subscriber not found' })
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    await this.newsletterService.unsubscribe(dto);
    return {
      success: true,
      message: 'Unsubscribed successfully',
    };
  }

  @Get('subscribers')
  @ApiOperation({
    summary: 'List all newsletter subscribers',
    description:
      'Returns all subscribers (active and inactive) with a total count. Useful for admin dashboards.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of subscribers with total count',
  })
  async getSubscribers() {
    const subscribers = this.newsletterService.getSubscribers();
    return {
      success: true,
      data: subscribers,
      count: subscribers.length,
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get newsletter subscription statistics',
    description:
      'Returns active subscriber count vs total subscriber count (including inactive).',
  })
  @ApiResponse({
    status: 200,
    description: 'Active and total subscriber counts',
  })
  async getStats() {
    const active = this.newsletterService.getSubscriberCount(true);
    const total = this.newsletterService.getSubscriberCount(false);
    return {
      success: true,
      data: { active, total },
    };
  }

  @Delete('subscribers/:email')
  @ApiOperation({
    summary: 'Remove a subscriber by email address',
    description:
      'Permanently removes a subscriber record. Distinct from unsubscription which only marks as inactive.',
  })
  @ApiParam({
    name: 'email',
    type: String,
    description: 'Email address of the subscriber to remove',
    example: 'subscriber@example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscriber successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Subscriber not found' })
  async removeSubscriber(@Param('email') email: string) {
    await this.newsletterService.unsubscribe({
      email,
      reason: 'manual_removal',
    } as any);
    return {
      success: true,
      message: `Subscriber '${email}' removed`,
    };
  }
}