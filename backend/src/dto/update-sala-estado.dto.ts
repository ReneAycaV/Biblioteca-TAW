import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoSala } from '../database/entities/sala.entity';

export class UpdateSalaEstadoDto {
  @ApiProperty({
    description: 'Nuevo estado de la sala',
    enum: EstadoSala,
    example: EstadoSala.DISPONIBLE,
    required: true,
  })
  @IsEnum(EstadoSala)
  estado!: EstadoSala;
}
