import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DynamicSchemaController } from './dynamic-schema.controller';
import { DynamicSchemaService } from './services/dynamic-schema.service';
import { DynamicSchemaRepository } from './dynamic-schema.repository';
import { SchemaCompilerService } from './services/schema-compiler.service';
import { SchemaRegistryService } from './services/schema-registry.service';
import { TextSourceAdapter } from './adapters/text-source.adapter';
import { ImageSourceAdapter } from './adapters/image-source.adapter';
import { DocumentSourceAdapter } from './adapters/document-source.adapter';
import { JsonSchemaSourceAdapter } from './adapters/json-schema-source.adapter';
import { DslSourceAdapter } from './adapters/dsl-source.adapter';
import { MongoInferenceSourceAdapter } from './adapters/mongo-inference-source.adapter';
import {
  DynamicSchemaEntity,
  DynamicSchemaSchema,
} from './schemas/dynamic-schema.schema';
import { AiModule } from '@common/ai';
import { DocumentsModule } from '@common/documents';
import { SsrfGuard } from '@common/common';

@Module({
  imports: [
    AiModule,
    DocumentsModule,
    MongooseModule.forFeature([
      { name: DynamicSchemaEntity.name, schema: DynamicSchemaSchema },
    ]),
  ],
  controllers: [DynamicSchemaController],
  providers: [
    DynamicSchemaService,
    DynamicSchemaRepository,
    SchemaCompilerService,
    SchemaRegistryService,
    TextSourceAdapter,
    ImageSourceAdapter,
    DocumentSourceAdapter,
    JsonSchemaSourceAdapter,
    DslSourceAdapter,
    MongoInferenceSourceAdapter,
    SsrfGuard,
  ],
  exports: [DynamicSchemaService, SchemaRegistryService, SchemaCompilerService, SsrfGuard],
})
export class DynamicSchemaModule {}
