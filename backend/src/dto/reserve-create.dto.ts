import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsDateString } from 'class-validator';

export class ReserveCreateDto {
  @ApiProperty({
    example: 1,
    description: 'ID de la sala a reservar',
  })
  @IsNumber()
  idSala!: number;

  @ApiProperty({
    example: '2026-06-20',
    description: 'Fecha de la reserva (YYYY-MM-DD)',
  })
  @IsDateString()
  fechaReserva!: string;

  @ApiProperty({
    example: '1',
    description: 'Bloque horario (1=A, 2=B, 3=C, ... 11=K)',
  })
  @IsNumber()
  bloqueHorario!: number;
}
