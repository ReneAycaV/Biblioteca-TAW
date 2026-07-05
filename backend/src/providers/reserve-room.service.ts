import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import {
  ReservaEntity,
  EstadoReserva,
} from '../database/entities/reserva.entity';
import { SalaEntity, EstadoSala } from '../database/entities/sala.entity';
import { UsuarioEntity } from '../database/entities/usuario.entity';
import { ReserveCreateDto } from '../dto/reserve-create.dto';
import { ReserveResponseDto } from '../dto/reserve-response.dto';
import { LibraryAccessService } from './library-access.service';
import { BloqueHorario } from '../database/entities/reserva.entity';

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

  // crear reserva
  async create(
    dto: ReserveCreateDto,
    usuarioId: number,
  ): Promise<ReserveResponseDto> {
    // validar si la sala existe
    const sala = await this.salaRepository.findOne({
      where: { idSala: dto.idSala },
    });

    // mensaje si no hay sala HTTP 404 (Not Found)
    if (!sala) {
      throw new NotFoundException(`La sala con ID ${dto.idSala} no existe`);
    }

    // validar estado de la sala = EstadoSala.DISPONIBLE (2=1?)
    if (sala.estado !== EstadoSala.DISPONIBLE) {
      // mensaje si no esta disponible HTTP 403 (Forbidden)
      throw new ForbiddenException(
        `La sala no está disponible actualmente. Estado: ${sala.estado}`,
      );
    }

    // validar si el usuario existe
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: usuarioId },
    });

    // mensaje si no hay usuario HTTP 404 (Not Found)
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
    }

    // validar no choque de horario
    // diccionario bloques de horarios
    const bloqueHorarios: Record<number, { inicio: string; fin: string }> = {
      1: { inicio: '08:00:00', fin: '09:00:00' },
      2: { inicio: '09:00:00', fin: '10:00:00' },
      3: { inicio: '10:00:00', fin: '11:00:00' },
      4: { inicio: '11:00:00', fin: '12:00:00' },
      5: { inicio: '12:00:00', fin: '13:00:00' },
      6: { inicio: '13:00:00', fin: '14:00:00' },
      7: { inicio: '14:00:00', fin: '15:00:00' },
      8: { inicio: '15:00:00', fin: '16:00:00' },
      9: { inicio: '16:00:00', fin: '17:00:00' },
      10: { inicio: '17:00:00', fin: '18:00:00' },
      11: { inicio: '18:00:00', fin: '19:00:00' },
    };

    // bloque que envio el dto del frontend
    const nuevoRango = bloqueHorarios[dto.bloqueHorario];

    if (!nuevoRango) {
      throw new BadRequestException(
        `El bloque horario ${dto.bloqueHorario} no es válido. Debe ser del 1 al 11`,
      );
    }

    // validar que la fecha de reserva sea hoy
    const hoy = new Date();
    const hoyStr = hoy.toLocaleDateString('sv-SE', {
      timeZone: 'America/Santiago',
    }); // "2026-07-04"

    const fechaReservaStr = dto.fechaReserva; // "2026-07-04"

    // mensaje si no es la fecha de hoy
    if (fechaReservaStr !== hoyStr) {
      throw new BadRequestException(
        `Solo se pueden reservar salas para el día de hoy (${hoyStr})`,
      );
    }

    // busca si el usuario tiene alguna reserva que aun no haya terminado
    const reservaActivaUsuario = await this.reservaRepository
      .createQueryBuilder('reserva')
      .where('reserva.idUsuario = :usuarioId', { usuarioId })
      .andWhere('reserva.estado = :estado', { estado: EstadoReserva.ACTIVA })
      .andWhere('DATE(reserva.fecha_reserva) = :fecha', { fecha: hoyStr })
      .getOne();

    if (reservaActivaUsuario) {
      const rangoActivo = bloqueHorarios[reservaActivaUsuario.bloqueHorario];
      const ahora = new Date();
      const horaActual = ahora.toTimeString().slice(0, 8);
      // const horaActual = '13:00:00'; para probar

      if (horaActual <= rangoActivo.fin) {
        throw new ForbiddenException(
          `Ya tienes una reserva activa en el bloque ${reservaActivaUsuario.bloqueHorario} (${rangoActivo.inicio} - ${rangoActivo.fin}). No puedes reservar otra sala hasta que termine tu reserva actual.`,
        );
      }
    }

    // buscar reservas existentes en la misma sala, fecha y activas
    const reservasExistentes = await this.reservaRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.idSala', 'sala')
      .where('reserva.idSala = :salaId', { salaId: dto.idSala })
      .andWhere('reserva.fechaReserva = :fecha', { fecha: dto.fechaReserva })
      .andWhere('reserva.estado = :estado', { estado: EstadoReserva.ACTIVA })
      .getMany();

    // ve todas las reservas existentes y compara horarios.
    for (const reservaExistente of reservasExistentes) {
      const rangoExistente = bloqueHorarios[reservaExistente.bloqueHorario];

      if (
        rangoExistente.inicio < nuevoRango.fin &&
        rangoExistente.fin > nuevoRango.inicio
      ) {
        // suelta error si hay choque de horario en reserva
        throw new ForbiddenException(
          `La sala ya está reservada en el bloque ${reservaExistente.bloqueHorario} (${rangoExistente.inicio} - ${rangoExistente.fin})`,
        );
      }
    }

    // validar estado academico
    await this.libraryAccessService.validateAcademicStatus(usuarioId);

    // validar no multa
    await this.libraryAccessService.validateNoPendingFines(usuarioId);

    // crear la reserva para BD
    const nuevaReserva = this.reservaRepository.create({
      idSala: { idSala: dto.idSala },
      idUsuario: { idUsuario: usuarioId },
      fechaReserva: dto.fechaReserva,
      bloqueHorario: dto.bloqueHorario as BloqueHorario,
      estado: EstadoReserva.ACTIVA,
      nombreSala: sala.nombreSala,
    });

    const reservaGuardada = await this.reservaRepository.save(nuevaReserva);

    const estadoMap = {
      1: 'Activa',
      2: 'Cancelada',
      3: 'Finalizada',
    };

    // devolver la respuesta al frontend
    return {
      idReserva: reservaGuardada.idReserva,
      idSala: dto.idSala,
      fechaReserva: dto.fechaReserva,
      bloqueHorario: reservaGuardada.bloqueHorario,
      estado: estadoMap[reservaGuardada.estado],
      motivoCancelacion: reservaGuardada.motivoCancelacion,
      nombreSala: reservaGuardada.nombreSala,
    };
  }

  // busca todas las reservas de un usuario (idUsuario = usuarioId), devuelve array
  async findEntitiesByUser(usuarioId: number): Promise<ReservaEntity[]> {
    return this.reservaRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.idSala', 'sala')
      .leftJoinAndSelect('reserva.idUsuario', 'usuario')
      .where('reserva.id_usuario = :usuarioId', { usuarioId })
      .getMany();
  }

  // filtra todas las reservas de un usuario, solo los datos necesarios
  async findByUser(usuarioId: number): Promise<ReserveResponseDto[]> {
    const reservas = await this.findEntitiesByUser(usuarioId);

    const estadoMap = {
      1: 'Activa',
      2: 'Cancelada',
      3: 'Finalizada',
    };

    return reservas.map((reserva) => ({
      idReserva: reserva.idReserva,
      idSala: reserva.idSala.idSala,
      fechaReserva: reserva.fechaReserva as unknown as string,
      bloqueHorario: reserva.bloqueHorario,
      estado: estadoMap[reserva.estado],
      motivoCancelacion: reserva.motivoCancelacion,
      nombreSala: reserva.nombreSala,
    }));
  }

  //  busca una reserva por su ID
  async findEntityById(id: number): Promise<ReservaEntity | null> {
    return this.reservaRepository.findOne({
      where: { idReserva: id },
      relations: ['idUsuario', 'idSala'],
    });
  }

  // filtra una reserva específica por su ID, solo los datos necesarios
  async findById(id: number): Promise<ReserveResponseDto | null> {
    const reserva = await this.findEntityById(id);
    if (!reserva) return null;

    const estadoMap = {
      1: 'Activa',
      2: 'Cancelada',
      3: 'Finalizada',
    };

    return {
      idReserva: reserva.idReserva,
      idSala: reserva.idSala.idSala,
      fechaReserva: reserva.fechaReserva as unknown as string,
      bloqueHorario: reserva.bloqueHorario,
      estado: estadoMap[reserva.estado],
      motivoCancelacion: reserva.motivoCancelacion,
      nombreSala: reserva.nombreSala,
    };
  }

  // cancelar reserva
  async cancel(
    id: number,
    usuarioId: number,
    motivoCancelacion?: string,
  ): Promise<{ message: string; idReserva: number }> {
    // Busca una reserva cuyo idReserva coincida
    const reserva = await this.reservaRepository.findOne({
      where: { idReserva: id },
      relations: ['idSala', 'idUsuario'],
    });

    // mensaje si no hay reserva HTTP 404 (Not Found)
    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    // valida que el usuario es el dueño de la reserva HTTP 403 (Forbidden)
    if (reserva.idUsuario.idUsuario !== usuarioId) {
      throw new ForbiddenException(
        'No puedes cancelar reservas de otro usuario',
      );
    }

    // valida que la reserva no esté ya cancelada HTTP 400
    if (reserva.estado === EstadoReserva.CANCELADA) {
      throw new BadRequestException('Esta reserva ya está cancelada');
    }

    // valida que la reserva no esté ya finalizada HTTP 400
    if (reserva.estado === EstadoReserva.FINALIZADA) {
      throw new BadRequestException(
        'No se puede cancelar una reserva finalizada',
      );
    }

    // valida que no se cancele una reserva de fecha pasada
    const hoy = new Date();
    const hoyStr = hoy.toLocaleDateString('sv-SE', {
      timeZone: 'America/Santiago',
    });

    const fechaReservaStr =
      reserva.fechaReserva instanceof Date
        ? reserva.fechaReserva.toLocaleDateString('sv-SE', {
            timeZone: 'America/Santiago',
          })
        : reserva.fechaReserva;

    if (fechaReservaStr < hoyStr) {
      throw new BadRequestException(
        'No se puede cancelar una reserva de una fecha pasada',
      );
    }

    // cancela la reserva
    reserva.estado = EstadoReserva.CANCELADA;
    reserva.motivoCancelacion = motivoCancelacion;
    await this.reservaRepository.save(reserva);

    return { message: 'Reserva cancelada exitosamente', idReserva: id };
  }

  // entrega todas las salas registradas
  async getAllSalas(): Promise<SalaEntity[]> {
    return this.salaRepository.find();
  }

  // entrega una sala por su ID
  async getSalaById(idSala: number): Promise<SalaEntity | null> {
    return this.salaRepository.findOne({ where: { idSala } });
  }

  // revisa, actualiza y finaliza reservas vencidas
  async finalizarReservasVencidas(): Promise<void> {
    // obtiene la hora actual en formato "HH:MM:SS"
    const ahora = new Date();
    const horaActual = ahora.toTimeString().slice(0, 8);

    // mapas de bloques a hora fin
    const bloqueHorarios = {
      1: '09:00:00',
      2: '10:00:00',
      3: '11:00:00',
      4: '12:00:00',
      5: '13:00:00',
      6: '14:00:00',
      7: '15:00:00',
      8: '16:00:00',
      9: '17:00:00',
      10: '18:00:00',
      11: '19:00:00',
    };

    // busca reservas activas que ya finalizaron
    const reservasActivas = await this.reservaRepository
      .createQueryBuilder('reserva')
      .where('reserva.estado = :estado', { estado: EstadoReserva.ACTIVA })
      .getMany();

    // filtra las que ya vencieron
    const reservasAVencer = reservasActivas.filter((reserva) => {
      const horaFin = bloqueHorarios[reserva.bloqueHorario];
      return horaActual >= horaFin; // Si la hora actual ya pasó la hora fin
    });

    // actualizar estado a FINALIZADA
    for (const reserva of reservasAVencer) {
      reserva.estado = EstadoReserva.FINALIZADA;
      await this.reservaRepository.save(reserva);
    }

    console.log(
      `${reservasAVencer.length} reservas finalizadas automáticamente.`,
    );
  }

  // cron job que se ejecuta cada 5 minutos
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleReservasVencidas() {
    await this.finalizarReservasVencidas();
  }
}
