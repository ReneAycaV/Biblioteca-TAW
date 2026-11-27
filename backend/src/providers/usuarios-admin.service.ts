import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';

import { RolUsuario, UsuarioEntity } from '../database/entities/usuario.entity';
import { CreateUsuarioDto, UpdateUsuarioDto } from '../dto/usuario-admin.dto';

@Injectable()
export class UsuariosAdminService {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepository: Repository<UsuarioEntity>,
  ) {}

  // passwordHash tiene select:false, así que nunca se envía al frontend
  findAll(): Promise<UsuarioEntity[]> {
    return this.usuarioRepository.find({ order: { idUsuario: 'DESC' } });
  }

  async findOne(id: number): Promise<UsuarioEntity> {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: id },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return usuario;
  }

  async create(dto: CreateUsuarioDto): Promise<UsuarioEntity> {
    const correo = dto.correo.trim().toLowerCase();
    const rut = dto.rut.trim();
    await this.validarUnicos(correo, rut);

    const usuario = this.usuarioRepository.create({
      nombre: dto.nombre.trim(),
      apellido: dto.apellido.trim(),
      rut,
      correo,
      passwordHash: await bcryptjs.hash(dto.password, 10),
      rol: dto.rol,
      telefono: dto.telefono?.trim() || undefined,
      estadoAcademico: dto.estadoAcademico ?? 'activo',
    });

    const guardado = await this.usuarioRepository.save(usuario);
    return this.findOne(guardado.idUsuario);
  }

  async update(
    id: number,
    dto: UpdateUsuarioDto,
    idAdminActual: number,
  ): Promise<UsuarioEntity> {
    const usuario = await this.findOne(id);

    // Evita que el admin se bloquee a sí mismo el acceso al panel
    if (id === idAdminActual) {
      if (dto.rol !== undefined && dto.rol !== RolUsuario.ADMIN) {
        throw new BadRequestException(
          'No puedes quitarte a ti mismo el rol de administrador',
        );
      }
      if (dto.estadoAcademico === 'inactivo') {
        throw new BadRequestException('No puedes desactivar tu propia cuenta');
      }
    }

    const correo = dto.correo?.trim().toLowerCase();
    const rut = dto.rut?.trim();
    await this.validarUnicos(correo, rut, id);

    if (dto.nombre !== undefined) usuario.nombre = dto.nombre.trim();
    if (dto.apellido !== undefined) usuario.apellido = dto.apellido.trim();
    if (rut !== undefined) usuario.rut = rut;
    if (correo !== undefined) usuario.correo = correo;
    if (dto.rol !== undefined) usuario.rol = dto.rol;
    if (dto.telefono !== undefined) usuario.telefono = dto.telefono.trim();
    if (dto.estadoAcademico !== undefined) {
      usuario.estadoAcademico = dto.estadoAcademico;
    }

    await this.usuarioRepository.save(usuario);

    if (dto.password) {
      await this.usuarioRepository.update(
        { idUsuario: id },
        { passwordHash: await bcryptjs.hash(dto.password, 10) },
      );
    }

    return this.findOne(id);
  }

  async cambiarEstado(
    id: number,
    estadoAcademico: string,
    idAdminActual: number,
  ): Promise<UsuarioEntity> {
    if (id === idAdminActual && estadoAcademico === 'inactivo') {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }
    const usuario = await this.findOne(id);
    usuario.estadoAcademico = estadoAcademico;
    return this.usuarioRepository.save(usuario);
  }

  private async validarUnicos(
    correo?: string,
    rut?: string,
    idExcluir?: number,
  ): Promise<void> {
    const excluir = idExcluir ? { idUsuario: Not(idExcluir) } : {};

    if (correo) {
      const existe = await this.usuarioRepository.exists({
        where: { correo, ...excluir },
      });
      if (existe) {
        throw new ConflictException('Ya existe un usuario con ese correo');
      }
    }

    if (rut) {
      const existe = await this.usuarioRepository.exists({
        where: { rut, ...excluir },
      });
      if (existe) {
        throw new ConflictException('Ya existe un usuario con ese RUT');
      }
    }
  }
}
