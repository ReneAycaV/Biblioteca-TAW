import { IsNumber, IsDateString, IsString } from 'class-validator';

export class ReserveCreateDto {
  @IsNumber()
  idSala!: number;

  @IsDateString()
  fechaReserva!: string;

  @IsString()
  horaInicio!: string; // HH:MM:SS

  @IsString()
  horaFin!: string; // HH:MM:SS
}
