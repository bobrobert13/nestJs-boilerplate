import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@common/database';
import { InngestModule } from '@common/inngest';
import { PlaywrightModule } from '@common/playwright';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { MangasModule } from './modules/mangas/mangas.module';

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
    MangasModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}