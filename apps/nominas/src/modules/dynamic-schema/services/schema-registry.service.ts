import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchemaCompilerService } from './schema-compiler.service';
import {
  DynamicSchemaRepository,
  DynamicSchemaMetadata,
} from '../dynamic-schema.repository';
import { SchemaSource } from '../interfaces/schema-source.enum';
import { GeneratedSchema } from '@common/ai';

/**
 * Coordinates SchemaCompilerService (in-memory + Mongo model registration)
 * with DynamicSchemaRepository (metadata persistence). On startup it
 * rehydrates all persisted schemas via rehydrate().
 */
@Injectable()
export class SchemaRegistryService implements OnModuleInit {
  private readonly logger = new Logger(SchemaRegistryService.name);

  constructor(
    private readonly compiler: SchemaCompilerService,
    private readonly repository: DynamicSchemaRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.DYNAMIC_SCHEMA_LEGACY === 'true') {
      this.logger.warn('DYNAMIC_SCHEMA_LEGACY=true: skipping rehydration');
      return;
    }
    let rehydrated = 0;
    let errors = 0;
    try {
      const all = await this.repository.findAll();
      for (const meta of all) {
        const result = this.compiler.rehydrate(meta);
        if (result.ok) rehydrated++;
        else {
          errors++;
          this.logger.error(
            `rehydrate failed for ${meta.collectionName}: ${result.error}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        'rehydrate() crashed',
        err instanceof Error ? err.stack : String(err),
      );
    }
    this.logger.log(
      `rehydration complete: rehydrated=${rehydrated} errors=${errors}`,
    );
  }

  /** Persist metadata + register model. Idempotent. */
  async register(
    schema: GeneratedSchema,
    options: {
      source: SchemaSource;
      provider?: string;
      model?: string;
      registeredBy?: string;
    },
  ): Promise<
    | {
        ok: true;
        collectionName: string;
        fieldsHash: string;
        idempotent?: boolean;
      }
    | { ok: false; errors: string[] }
  > {
    const result = this.compiler.compileAndRegister(
      schema,
      schema.collectionName,
    );
    if (!result.success)
      return { ok: false, errors: result.errors || ['compile failed'] };

    try {
      await this.repository.upsert({
        collectionName: result.collectionName,
        schemaDefinition: JSON.stringify(result.normalizedSchema ?? schema),
        fieldsHash: result.fieldsHash,
        source: options.source,
        provider: options.provider,
        model: options.model,
        registeredBy: options.registeredBy,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { ok: false, errors: ['REPOSITORY_ERROR: ' + message] };
    }

    return {
      ok: true,
      collectionName: result.collectionName,
      fieldsHash: result.fieldsHash,
      idempotent: result.idempotent,
    };
  }

  async list(): Promise<DynamicSchemaMetadata[]> {
    return this.repository.findAll();
  }

  async unregister(
    collectionName: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const meta = await this.repository.findByCollectionName(collectionName);
    if (!meta)
      return { ok: false, error: 'COLLECTION_NOT_FOUND: ' + collectionName };
    const removed = this.compiler.unregister(collectionName);
    await this.repository.remove(collectionName);
    return { ok: removed };
  }
}
