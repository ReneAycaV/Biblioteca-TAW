import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PrestamoEntity } from '../database/entities/prestamo.entity';
import { LibroEntity } from '../database/entities/libro.entity';
import { UsuarioEntity } from '../database/entities/usuario.entity';
import { ReservaEntity } from '../database/entities/reserva.entity';
import { PrestamosController } from '../controllers/prestamos/prestamos.controller';
import { PrestamosService } from '../providers/prestamos.service';
import { LibraryAccessService } from '../providers/library-access.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PrestamoEntity,
      LibroEntity,
      UsuarioEntity,
      ReservaEntity,
    ]),
  ],
  controllers: [PrestamosController],
  providers: [PrestamosService, LibraryAccessService],
  exports: [PrestamosService],
})
export class PrestamosModule {}
