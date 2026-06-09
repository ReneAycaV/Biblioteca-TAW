import { IsNumber, IsDateString, IsString } from 'class-validator';

export class ReserveCreateDto {
  @IsNumber()
  idSala!: number;

  @IsDateString()
  fechaReserva!: string;

  @IsString()
  bloqueHorario!: string;
}
