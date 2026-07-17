import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class NewsletterSubscriber {
  @ApiProperty({
    example: 'subscriber@example.com',
    description: 'Email address of the subscriber',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Optional display name of the subscriber',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    description: 'ISO 8601 timestamp when the subscription was created',
  })
  @IsDateString()
  subscribedAt!: Date;

  @ApiPropertyOptional({
    example: '2026-06-01T00:00:00.000Z',
    description:
      'ISO 8601 timestamp when the subscription was cancelled, if applicable',
  })
  @IsOptional()
  @IsDateString()
  unsubscribedAt?: Date;

  @ApiProperty({
    example: true,
    description: 'Whether the subscription is currently active',
  })
  @IsBoolean()
  isActive!: boolean;
}

export class SubscribeDto {
  @ApiProperty({
    example: 'subscriber@example.com',
    description: 'Email address to subscribe',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Optional display name for the subscriber',
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class UnsubscribeDto {
  @ApiProperty({
    example: 'subscriber@example.com',
    description: 'Email address to unsubscribe',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: 'unsubscribed_by_user',
    description: 'Optional reason for unsubscription',
    enum: ['unsubscribed_by_user', 'complaint', 'bounced', 'manual_removal'],
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
