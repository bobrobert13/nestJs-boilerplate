import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DynamicSchemaController } from './dynamic-schema.controller';
import { DynamicSchemaService } from './services/dynamic-schema.service';
import { DynamicSchemaRepository } from './dynamic-schema.repository';
import { SchemaCompilerService } from './services/schema-compiler.service';
import { SchemaRegistryService } from './services/schema-registry.service';
import {
  DynamicSchemaEntity,
  DynamicSchemaSchema,
} from './schemas/dynamic-schema.schema';
import { AiModule } from '@common/ai';
import { DocumentsModule } from '@common/documents';

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
  ],
  exports: [DynamicSchemaService, SchemaRegistryService, SchemaCompilerService],
})
export class DynamicSchemaModule {}
