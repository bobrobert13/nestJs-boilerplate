import { Module } from '@nestjs/common';
import { DynamicSchemaController } from './dynamic-schema.controller';
import { DynamicSchemaService } from './services/dynamic-schema.service';
import { DynamicSchemaRepository } from './dynamic-schema.repository';
import { SchemaCompilerService } from './services/schema-compiler.service';
import { AiModule } from '@common/ai';
import { DocumentsModule } from '@common/documents';

@Module({
  imports: [AiModule, DocumentsModule],
  controllers: [DynamicSchemaController],
  providers: [
    DynamicSchemaService,
    DynamicSchemaRepository,
    SchemaCompilerService,
  ],
  exports: [DynamicSchemaService],
})
export class DynamicSchemaModule {}
