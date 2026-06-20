/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    example: 'yazuska@gmail.com',
    description: 'Correo electrónico del usuario',
    required: true,
    type: String,
  })
  @IsEmail()
  correo!: string;

  @ApiProperty({
    example: 'contraseña',
    description: 'Contraseña del usuario',
    required: true,
    type: String,
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
