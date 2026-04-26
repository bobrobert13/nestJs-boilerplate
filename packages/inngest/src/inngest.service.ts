import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inngest } from 'inngest';
import { serve } from 'inngest/express';
import { functions } from './functions';
import type { ScrappingEventName, InngestEventPayload } from './serve/interfaces/inngest.interfaces';
@Injectable()
export class InngestService implements OnModuleInit {
  private readonly logger = new Logger(InngestService.name);
  private readonly _client: Inngest;
  private readonly _baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this._baseUrl =
      this.configService.get<string>('INNGEST_BASE_URL') ??
      'https://inngest.treborjs-dev.online/';

    const eventKey = this.configService.get<string>('INNGEST_EVENT_KEY');
    const signingKey = this.configService.get<string>('INNGEST_SIGNING_KEY');

    this._client = new Inngest({
      id: 'nominas',
      baseUrl: this._baseUrl,
      eventKey,
      signingKey,
    });
  }

  async onModuleInit() {
    const eventKey = this.configService.get<string>('INNGEST_EVENT_KEY');
    const signingKey = this.configService.get<string>('INNGEST_SIGNING_KEY');

    if (!eventKey || !signingKey) {
      this.logger.warn(
        'INNGEST_EVENT_KEY or INNGEST_SIGNING_KEY not configured. Some features may not work.',
      );
    } else {
      this.logger.log(
        `Inngest client initialized with base URL: ${this._baseUrl}`,
      );
    }
  }

  get client(): Inngest {
    return this._client;
  }

  get serveHandler() {
    return serve({
      client: this._client,
      functions,
    });
  }

  async sendEvent<T extends ScrappingEventName>(
    payload: InngestEventPayload<T>,
  ): Promise<void> {
    try {
      await this._client.send(payload);
      this.logger.debug(`Event sent: ${payload.name}`, {
        eventId: payload.id,
        eventName: payload.name,
      });
    } catch (error) {
      this.logger.error(`Failed to send event: ${payload.name}`, error);
      throw error;
    }
  }

  async sendEvents<T extends ScrappingEventName>(
    payloads: InngestEventPayload<T>[],
  ): Promise<void> {
    try {
      await this._client.send(payloads);
      this.logger.debug(`Batch events sent: ${payloads.length}`);
    } catch (error) {
      this.logger.error('Failed to send batch events', error);
      throw error;
    }
  }

  createHolaInngestPayload(
    message: string = 'HOLA INNGEST',
  ): InngestEventPayload<'scrapping/hola-inngest'> {
    return {
      name: 'scrapping/hola-inngest',
      data: {
        message,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async sendHolaInngest(message: string = 'HOLA INNGEST'): Promise<void> {
    const payload = this.createHolaInngestPayload(message);
    await this.sendEvent(payload);
    this.logger.log(`Hola Inngest event sent: "${message}"`);
  }
}
