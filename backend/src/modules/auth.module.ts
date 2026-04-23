import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { TestController } from '../controllers/auth/test.controller';
import { UsuarioEntity } from '../database/entities/usuario.entity';
import { AuthController } from '../controllers/auth/auth.controller';
import { AuthService } from '../providers/auth.service';
import { JwtStrategy } from '../security/strategies/jwt.strategy';
import { LibraryAccessService } from '../providers/library-access.service';
import { LibraryController } from '../controllers/library/library.controller';


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
  controllers: [AuthController, TestController, LibraryController],
  providers: [AuthService, JwtStrategy, LibraryAccessService],
  exports: [AuthService, LibraryAccessService],
})
export class AuthModule {}