import { IsNumber, IsString } from 'class-validator';

export class ReserveResponseDto {
  @IsNumber()
  idReserva!: number;

  @IsNumber()
  idSala!: number;

  @IsString()
  fechaReserva!: string;

  @IsString()
  horaInicio!: string;

  @IsString()
  horaFin!: string;
}
