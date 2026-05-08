import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@common/database';
import { InngestModule } from '@common/inngest';
import { PlaywrightModule } from '@common/playwright';
import { DatabaseExceptionFilter } from '@common/common';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { DynamicSchemaModule } from './modules/dynamic-schema/dynamic-schema.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    InngestModule,
    PlaywrightModule,
    UsuariosModule,
    DynamicSchemaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
