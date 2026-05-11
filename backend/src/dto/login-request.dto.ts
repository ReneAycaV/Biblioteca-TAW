import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @IsEmail()
  correo!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
