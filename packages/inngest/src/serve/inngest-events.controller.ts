import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { InngestService } from '../inngest.service';

class SendHolaInngestDto {
  message?: string;
}

@ApiTags('inngest-events')
@Controller('inngest-events')
export class InngestEventsController {
  private readonly logger = new Logger(InngestEventsController.name);

  constructor(private readonly inngest: InngestService) {}

  @Post('hola-inngest')
  @ApiOperation({
    summary: 'Send HOLA INNGEST event to Inngest server',
    description:
      'Triggers the hola-inngest function on your self-hosted Inngest server',
  })
  @ApiBody({
    description: 'Optional custom message (default: "HOLA INNGEST")',
    type: SendHolaInngestDto,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Event sent successfully to Inngest',
  })
  @ApiResponse({ status: 500, description: 'Failed to send event' })
  @HttpCode(HttpStatus.OK)
  async sendHolaInngest(
    @Body() body: SendHolaInngestDto = { message: 'HOLA INNGEST' },
  ) {
    const message = body.message ?? 'HOLA INNGEST';
    this.logger.log(`Sending HOLA INNGEST event: "${message}"`);

    try {
      await this.inngest.sendHolaInngest(message);
      this.logger.log('Event sent successfully!');

      return {
        success: true,
        message: 'Event sent to Inngest successfully',
        event: {
          name: 'scrapping/hola-inngest',
          data: {
            message,
            timestamp: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      this.logger.error('Failed to send event', error);
      throw error;
    }
  }
}
