import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ReservaEntity,
  EstadoReserva,
} from '../database/entities/reserva.entity';
import { SalaEntity, EstadoSala } from '../database/entities/sala.entity';
import { UsuarioEntity } from '../database/entities/usuario.entity';
import { ReserveCreateDto } from '../dto/reserve-create.dto';
import { ReserveResponseDto } from '../dto/reserve-response.dto';
import { LibraryAccessService } from './library-access.service';

@Injectable()
export class ReserveRoomService {
  constructor(
    @InjectRepository(ReservaEntity)
    private readonly reservaRepository: Repository<ReservaEntity>,

    @InjectRepository(SalaEntity)
    private readonly salaRepository: Repository<SalaEntity>,

    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepository: Repository<UsuarioEntity>,

    private readonly libraryAccessService: LibraryAccessService,
  ) {}

  async create(
    dto: ReserveCreateDto,
    usuarioId: number,
  ): Promise<ReserveResponseDto> {
    // validar si la sala existe
    const sala = await this.salaRepository.findOne({
      where: { idSala: dto.idSala },
    });

    if (!sala) {
      throw new NotFoundException(`La sala con ID ${dto.idSala} no existe`);
    }

    // validar estado de la sala = DISPONIBLE
    if (sala.estado !== EstadoSala.DISPONIBLE) {
      throw new ForbiddenException(
        `La sala no está disponible actualmente. Estado: ${sala.estado}`,
      );
    }

    // validar si el usuario existe
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
    }

    // validar que no se puede reservar en fecha pasada
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaReservaDate = new Date(dto.fechaReserva);

    if (fechaReservaDate < hoy) {
      throw new BadRequestException(
        `No se puede reservar en fechas pasadas. Fecha solicitada: ${dto.fechaReserva}`,
      );
    }

    // validar horaInicio debe ser menor que horaFin
    if (dto.horaInicio >= dto.horaFin) {
      throw new BadRequestException(
        `La hora de inicio (${dto.horaInicio}) debe ser menor que la hora de fin (${dto.horaFin})`,
      );
    }

    // validar no choque de "horario"
    const conflicto = await this.reservaRepository
      .createQueryBuilder('reserva')
      .where('reserva.sala.idSala = :salaId', { salaId: dto.idSala })
      .andWhere('reserva.fechaReserva = :fecha', { fecha: dto.fechaReserva })
      .andWhere('reserva.estado = :estado', { estado: EstadoReserva.ACTIVA })
      .andWhere(
        '(reserva.horaInicio < :horaFin AND reserva.horaFin > :horaInicio)',
        {
          horaInicio: dto.horaInicio,
          horaFin: dto.horaFin,
        },
      )
      .getOne();

    if (conflicto) {
      throw new ForbiddenException(
        `La sala ya está reservada en el horario solicitado (${dto.horaInicio} - ${dto.horaFin})`,
      );
    }

    // validar estado academico
    await this.libraryAccessService.validateAcademicStatus(usuarioId);

    // validar no multa
    await this.libraryAccessService.validateNoPendingFines(usuarioId);

    // crear la reserva para BD
    const nuevaReserva = this.reservaRepository.create({
      sala: { idSala: dto.idSala },
      usuario: { idUsuario: usuarioId },
      fechaReserva: dto.fechaReserva,
      horaInicio: dto.horaInicio,
      horaFin: dto.horaFin,
      estado: EstadoReserva.ACTIVA,
    });

    const reservaGuardada = await this.reservaRepository.save(nuevaReserva);

    // devolver la respuesta al frontend
    return {
      idReserva: reservaGuardada.idReserva,
      idSala: dto.idSala,
      fechaReserva: dto.fechaReserva,
      horaInicio: reservaGuardada.horaInicio,
      horaFin: reservaGuardada.horaFin,
    };
  }

  async findByUser(usuarioId: number): Promise<ReservaEntity[]> {
    return this.reservaRepository.find({
      where: { usuario: { idUsuario: usuarioId } },
      relations: ['sala'], // Si necesitas traer los datos relacionados
    });
  }

  async findById(id: number): Promise<ReservaEntity | null> {
    return this.reservaRepository.findOne({
      where: { idReserva: id },
      relations: ['usuario', 'sala'],
    });
  }

  async cancel(
    id: number,
    usuarioId: number,
  ): Promise<{ message: string; idReserva: number }> {
    const reserva = await this.reservaRepository.findOne({
      where: { idReserva: id },
      relations: ['usuario'],
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    if (reserva.usuario.idUsuario !== usuarioId) {
      throw new ForbiddenException(
        'No puedes cancelar reservas de otro usuario',
      );
    }

    if (reserva.estado === EstadoReserva.CANCELADA) {
      throw new BadRequestException('Esta reserva ya está cancelada');
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaReserva = new Date(reserva.fechaReserva);

    if (fechaReserva < hoy) {
      throw new BadRequestException(
        'No se puede cancelar una reserva de una fecha pasada',
      );
    }

    reserva.estado = EstadoReserva.CANCELADA;
    await this.reservaRepository.save(reserva);

    return { message: 'Reserva cancelada exitosamente', idReserva: id };
  }
}
