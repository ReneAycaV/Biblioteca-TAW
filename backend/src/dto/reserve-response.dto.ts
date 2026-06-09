import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ReserveResponseDto {
  @IsNumber()
  idReserva!: number;

  @IsNumber()
  idSala!: number;

  @IsString()
  fechaReserva!: string;

  @IsString()
  bloqueHorario!: string;

  @IsString()
  estado!: string;

  @IsOptional()
  @IsString()
  motivoCancelacion?: string;
}
