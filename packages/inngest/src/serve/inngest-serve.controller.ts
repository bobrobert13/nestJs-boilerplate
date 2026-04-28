import { Controller, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { InngestService } from '../inngest.service';

@ApiTags('inngest')
@Controller('inngest')
export class InngestServeController {
  constructor(private readonly inngestService: InngestService) {}

  @Post()
  @ApiOperation({ summary: 'Inngest function execution handler' })
  async handle(@Req() req: Request) {
    return this.inngestService.serveHandler(req, req.body);
  }
}