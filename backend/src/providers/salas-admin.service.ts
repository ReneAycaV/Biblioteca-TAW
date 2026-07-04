import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaEntity, EstadoSala } from '../database/entities/sala.entity';

@Injectable()
export class SalasAdminService {
  constructor(
    @InjectRepository(SalaEntity)
    private readonly salaRepository: Repository<SalaEntity>,
  ) {}

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
}
