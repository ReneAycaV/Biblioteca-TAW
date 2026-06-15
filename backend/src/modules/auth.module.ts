//Generales
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

//Entidades
import { UsuarioEntity } from '../database/entities/usuario.entity';
import { MultaEntity } from '../database/entities/multa.entity';

//Controladores
import { TestController } from '../controllers/auth/test.controller';
import { AuthController } from '../controllers/auth/auth.controller';
import { MultasController } from '../controllers/multas/multas.controller';
import { ValidacionesController } from '../controllers/validaciones/validaciones.controller';

//Servicios
import { AuthService } from '../providers/auth.service';
import { MultasService } from '../providers/multas.service';
import { ValidacionesService } from '../providers/validaciones.service';

//Seguridad
import { JwtStrategy } from '../security/strategies/jwt.strategy';
import { PrestamoEntity } from '../database/entities/prestamo.entity';
import { LibroEntity } from '../database/entities/libro.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioEntity, MultaEntity, PrestamoEntity, LibroEntity]),
    JwtModule.register({
      secret: 'super_secreto_hu17',
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],
  controllers: [AuthController, TestController, MultasController, ValidacionesController ],
  providers: [AuthService, MultasService, ValidacionesService, JwtStrategy ],
  exports: [AuthService],
})
export class AuthModule {}