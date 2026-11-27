import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsuarioEntity } from '../database/entities/usuario.entity';
import { UsuariosAdminController } from '../controllers/usuarios/usuarios-admin.controller';
import { UsuariosAdminService } from '../providers/usuarios-admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioEntity])],
  controllers: [UsuariosAdminController],
  providers: [UsuariosAdminService],
})
export class UsuariosModule {}
