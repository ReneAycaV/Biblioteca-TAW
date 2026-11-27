import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

// Consulta en lenguaje natural para los recomendadores con IA
export class IaConsultaDto {
  @ApiProperty({
    example:
      'Necesito una sala para 5 personas hoy en la tarde, cerca de la cafetería',
    description: 'Lo que necesita el estudiante, escrito con sus palabras',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(400)
  consulta!: string;
}
