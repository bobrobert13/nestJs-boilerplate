import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ScrapeResult,
  ScrapeResultDocument,
  ScrapeStatus,
} from './schemas/scrape-result.schema';

/**
 * Data-access layer for persisted {@link ScrapeResult} documents.
 */
@Injectable()
export class ScraperRepository {
  private readonly logger = new Logger(ScraperRepository.name);

  /**
   * @param model Injected Mongoose model for {@link ScrapeResult}.
   */
  constructor(
    @InjectModel(ScrapeResult.name)
    private readonly model: Model<ScrapeResultDocument>,
  ) {}

  /**
   * Create a new result record with status `pending`.
   * @param url The target URL.
   * @param strategyName Name of the strategy that will execute.
   * @returns The created document.
   */
  async create(
    url: string,
    strategyName: string,
  ): Promise<ScrapeResultDocument> {
    const doc = await this.model.create({
      url,
      strategyName,
      status: 'pending' as ScrapeStatus,
    });
    this.logger.log(`ScrapeResult created: ${doc._id} for ${url}`);
    return doc;
  }

  /** Return all results, newest first. */
  async findAll(): Promise<ScrapeResultDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  /** Look up the most recent result for a given URL. */
  async findByUrl(url: string): Promise<ScrapeResultDocument | null> {
    return this.model.findOne({ url }).sort({ createdAt: -1 }).exec();
  }

  /** Return the last N results regardless of URL. */
  async findRecent(limit = 20): Promise<ScrapeResultDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).limit(limit).exec();
  }

  /** Find a single result by its document id. */
  async findById(id: string): Promise<ScrapeResultDocument | null> {
    return this.model.findById(id).exec();
  }

  /**
   * Mark a job as succeeded and persist extracted data.
   * @param id Document id.
   * @param data Extracted structured data.
   */
  async markSuccess(id: string, data: Record<string, unknown>): Promise<void> {
    await this.model.findByIdAndUpdate(id, {
      status: 'success' as ScrapeStatus,
      data,
      errorMessage: null,
    });
    this.logger.log(`ScrapeResult ${id} marked success`);
  }

  /**
   * Mark a job as failed with an error message.
   * @param id Document id.
   * @param errorMessage Reason for failure.
   */
  async markFailed(id: string, errorMessage: string): Promise<void> {
    const doc = await this.model.findById(id);
    const retryCount = (doc?.retryCount ?? 0) + 1;
    await this.model.findByIdAndUpdate(id, {
      status: 'failed' as ScrapeStatus,
      errorMessage,
      retryCount,
    });
    this.logger.warn(`ScrapeResult ${id} marked failed: ${errorMessage}`);
  }

  /**
   * Update the status to `running` (in-flight).
   * @param id Document id.
   */
  async markRunning(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, {
      status: 'running' as ScrapeStatus,
    });
  }
}
