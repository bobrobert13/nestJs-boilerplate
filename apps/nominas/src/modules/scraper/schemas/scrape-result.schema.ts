import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/** Possible scrape statuses. */
export type ScrapeStatus = 'pending' | 'running' | 'success' | 'failed';

@Schema({ timestamps: true, collection: 'scrape_results' })
export class ScrapeResult {
  /** Target URL that was scraped. */
  @Prop({ type: String, required: true, index: true })
  url!: string;

  /** Name of the strategy that performed the scrape. */
  @Prop({ type: String, required: true })
  strategyName!: string;

  /**
   * Current status.
   * - `pending`: queued
   * - `running`: in-flight
   * - `success`: completed with data
   * - `failed`: completed with error
   */
  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'running', 'success', 'failed'],
    default: 'pending',
  })
  status!: ScrapeStatus;

  /** Scraped structured data (set on success). */
  @Prop({ type: Object, default: null })
  data!: Record<string, unknown> | null;

  /** Error message when status is `failed`. */
  @Prop({ type: String, default: null })
  errorMessage!: string | null;

  /**
   * Number of times the scrape has been retried.
   * Incremented on each retry attempt when the previous attempt failed.
   */
  @Prop({ type: Number, default: 0 })
  retryCount!: number;
}

export type ScrapeResultDocument = ScrapeResult & Document;

export const ScrapeResultSchema = SchemaFactory.createForClass(ScrapeResult);
