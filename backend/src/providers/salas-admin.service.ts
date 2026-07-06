import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SalaEntity,
  EstadoSala,
  UbicacionSala,
} from '../database/entities/sala.entity';

interface SalaAdminPayload {
  nombreSala?: string;
  capacidad?: number;
  ubicacion?: UbicacionSala | string;
  estado?: EstadoSala | string;
}

@Injectable()
export class SalasAdminService {
  constructor(
    @InjectRepository(SalaEntity)
    private readonly salaRepository: Repository<SalaEntity>,
  ) {}

  async create(dto: SalaAdminPayload): Promise<SalaEntity> {
    const sala = this.salaRepository.create({
      nombreSala: this.validarNombre(dto.nombreSala),
      capacidad: this.validarCapacidad(dto.capacidad),
      ubicacion: this.mapearUbicacion(dto.ubicacion),
      estado: this.mapearEstado(dto.estado),
    });

    return this.salaRepository.save(sala);
  }

  async update(id: number, dto: SalaAdminPayload): Promise<SalaEntity> {
    const sala = await this.salaRepository.findOne({
      where: { idSala: id },
    });

    if (!sala) {
      throw new NotFoundException(`Sala con ID ${id} no encontrada`);
    }

    if (dto.nombreSala !== undefined) {
      sala.nombreSala = this.validarNombre(dto.nombreSala);
    }

    if (dto.capacidad !== undefined) {
      sala.capacidad = this.validarCapacidad(dto.capacidad);
    }

    if (dto.ubicacion !== undefined) {
      sala.ubicacion = this.mapearUbicacion(dto.ubicacion);
    }

    if (dto.estado !== undefined) {
      sala.estado = this.mapearEstado(dto.estado);
    }

    return this.salaRepository.save(sala);
  }

  async remove(id: number): Promise<{ message: string; idSala: number }> {
    const sala = await this.salaRepository.findOne({
      where: { idSala: id },
    });

    if (!sala) {
      throw new NotFoundException(`Sala con ID ${id} no encontrada`);
    }

    await this.salaRepository.remove(sala);
    return { message: 'Sala eliminada correctamente', idSala: id };
  }

  async updateEstado(id: number, nuevoEstado: EstadoSala): Promise<SalaEntity> {
    // busca la sala
    const sala = await this.salaRepository.findOne({
      where: { idSala: id },
    });

    // error si no existe
    if (!sala) {
      throw new NotFoundException(`Sala con ID ${id} no encontrada`);
    }

    // actualizar estado
    sala.estado = nuevoEstado;

    return this.salaRepository.save(sala);
  }

  private validarNombre(nombreSala?: string): string {
    const nombre = nombreSala?.trim();

    if (!nombre) {
      throw new BadRequestException('El nombre de la sala es obligatorio');
    }

    return nombre;
  }

  private validarCapacidad(capacidad?: number): number {
    const capacidadNumerica = Number(capacidad);

    if (!Number.isInteger(capacidadNumerica) || capacidadNumerica < 1) {
      throw new BadRequestException('La capacidad debe ser un numero mayor a 0');
    }

    return capacidadNumerica;
  }

  private mapearUbicacion(ubicacion?: UbicacionSala | string): UbicacionSala {
    if (typeof ubicacion === 'number') return ubicacion;

    const ubicaciones: Record<string, UbicacionSala> = {
      Biblioteca: UbicacionSala.BIBLIOTECA,
      'Aulario A': UbicacionSala.AULARIO_A,
      'Aulario C': UbicacionSala.AULARIO_C,
      'Cafeteria A': UbicacionSala.CAFETERIA_A,
      'Cafeteria B': UbicacionSala.CAFETERIA_B,
      Auditorio: UbicacionSala.AUDITORIO_INF,
      'Auditorio INF': UbicacionSala.AUDITORIO_INF,
    };

    const ubicacionMapeada = ubicaciones[String(ubicacion ?? '')];
    if (!ubicacionMapeada) {
      throw new BadRequestException('La ubicacion de la sala no es valida');
    }

    return ubicacionMapeada;
  }

  private mapearEstado(estado?: EstadoSala | string): EstadoSala {
    if (typeof estado === 'number') return estado;

    const estados: Record<string, EstadoSala> = {
      Disponible: EstadoSala.DISPONIBLE,
      Mantenimiento: EstadoSala.MANTENIMIENTO,
      Bloqueada: EstadoSala.BLOQUEADA,
    };

    const estadoMapeado = estados[String(estado ?? 'Disponible')];
    if (!estadoMapeado) {
      throw new BadRequestException('El estado de la sala no es valido');
    }

    return estadoMapeado;
  }
}
