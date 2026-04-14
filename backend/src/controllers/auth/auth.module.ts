import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { TestController } from './test.controller';
import { UsuarioEntity } from '../../database/entities/usuario.entity';
import { AuthController } from './auth.controller';
import { AuthService } from '../../providers/auth/auth.service';
import { JwtStrategy } from '../../security/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioEntity]),
    JwtModule.register({
      secret: 'super_secreto_hu17',
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],
  controllers: [AuthController, TestController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}