import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { RolUsuario } from '../database/entities/usuario.entity';

export const ESTADOS_ACADEMICOS = ['activo', 'inactivo'] as const;

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Ana' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellido!: string;

  @ApiProperty({ example: '12345678-9' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  rut!: string;

  @ApiProperty({ example: 'ana.perez@nyu.edu' })
  @IsEmail()
  @MaxLength(120)
  correo!: string;

  @ApiProperty({ example: 'Clave123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: RolUsuario, example: RolUsuario.ESTUDIANTE })
  @IsEnum(RolUsuario)
  rol!: RolUsuario;

  @ApiPropertyOptional({ example: '+56912345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @ApiPropertyOptional({ enum: ESTADOS_ACADEMICOS, example: 'activo' })
  @IsOptional()
  @IsIn(ESTADOS_ACADEMICOS)
  estadoAcademico?: string;
}

// En la edición todos los campos son opcionales; si no viene password, se mantiene la actual
export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {}

export class UpdateEstadoUsuarioDto {
  @ApiProperty({ enum: ESTADOS_ACADEMICOS, example: 'inactivo' })
  @IsIn(ESTADOS_ACADEMICOS)
  estadoAcademico!: string;
}
