import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioEntity } from '../database/entities/usuario.entity';

@Injectable()
export class LibraryAccessService {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepository: Repository<UsuarioEntity>,
  ) {}

  async validateAcademicStatus(userId: number): Promise<UsuarioEntity> {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: userId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.estadoAcademico !== 'activo') {
      throw new ForbiddenException(
        'El estudiante no tiene estado académico activo',
      );
    }

    return usuario;
  }

  async validateNoPendingFines(userId: number): Promise<UsuarioEntity> {
    const usuario = await this.validateAcademicStatus(userId);

    if (usuario.tieneMultaImpaga) {
      throw new ForbiddenException(
        'El usuario tiene multas impagas y no puede reservar sala',
      );
    }

    return usuario;
  }
}
