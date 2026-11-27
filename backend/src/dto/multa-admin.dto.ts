import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolverEstadoLibroDto {
  @ApiProperty({
    enum: ['BUENO', 'PERDIDO'],
    example: 'BUENO',
    description: 'Resultado de la revisión del libro por el administrador',
  })
  @IsIn(['BUENO', 'PERDIDO'])
  estado!: 'BUENO' | 'PERDIDO';
}

export class CondonarMultaDto {
  @ApiProperty({ example: 'Licencia médica presentada' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo!: string;
}
