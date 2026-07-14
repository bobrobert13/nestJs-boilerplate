import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule, USER_SERVICE } from '@common/auth';
import { Usuario, UsuarioSchema } from './schemas/usuario.schema';
import { UsuariosRepository } from './usuarios.repository';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
    AuthModule,
  ],
  controllers: [UsuariosController],
  providers: [
    UsuariosRepository,
    UsuariosService,
    /** Wire UsuariosService as the real IUserService for AuthService. */
    { provide: USER_SERVICE, useExisting: UsuariosService },
  ],
  exports: [UsuariosService],
})
export class UsuariosModule {}
