import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@common/common';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto, UnsubscribeDto } from './interfaces/newsletter.interfaces';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  /**
   * PR5 / H6 / REQ-email-1,4 — throttled to 5 req / 60 s per IP.
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @Throttle({ limit: 5, ttl: 60 })
  @ApiOperation({
    summary: 'Subscribe an email address to the newsletter (double opt-in)',
    description:
      'Creates a pending subscriber and emails a single-use confirmation link valid for 24 hours.',
  })
  @ApiResponse({ status: 200, description: 'Confirmation email queued' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async subscribe(@Body() dto: SubscribeDto) {
    const subscriber = await this.newsletterService.subscribe(dto);
    return {
      success: true,
      data: {
        message:
          'If the email is valid, a confirmation link has been sent.',
      },
    };
  }

  /**
   * PR5 / H6 / REQ-email-2 — confirm via token; never echo the token in
   * the response.
   */
  @Get('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm a newsletter subscription via single-use token',
  })
  @ApiResponse({ status: 200, description: 'Confirmation result' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async confirm(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Missing confirmation token');
    }
    const result = await this.newsletterService.confirm(token);
    if (!result.ok) {
      throw new BadRequestException(result.message);
    }
    return { success: true, message: result.message };
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe an email address' })
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    await this.newsletterService.unsubscribe(dto);
    return { success: true, message: 'Unsubscribed successfully' };
  }

  @Get('subscribers')
  @ApiOperation({ summary: 'List newsletter subscribers' })
  async getSubscribers() {
    const subscribers = await this.newsletterService.getSubscribers();
    return { success: true, data: subscribers, count: subscribers.length };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get newsletter subscription statistics' })
  async getStats() {
    const active = await this.newsletterService.getSubscriberCount(true);
    const total = await this.newsletterService.getSubscriberCount(false);
    return { success: true, data: { active, total } };
  }

  @Delete('subscribers/:email')
  @ApiOperation({ summary: 'Remove a subscriber' })
  @ApiParam({ name: 'email', type: String })
  async removeSubscriber(@Param('email') email: string) {
    await this.newsletterService.unsubscribe({
      email,
      reason: 'manual_removal',
    } as any);
    return { success: true, message: `Subscriber '${email}' removed` };
  }
}