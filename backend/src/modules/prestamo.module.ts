import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrestamoController } from '../controllers/prestamos/prestamo.controller';
import { PrestamoService } from '../providers/prestamo.service';
import { PrestamoEntity } from '../database/entities/prestamo.entity';
import { LibroEntity } from '../database/entities/libro.entity';
import { UsuarioEntity } from '../database/entities/usuario.entity';
import { LibraryAccessService } from '../providers/library-access.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PrestamoEntity, LibroEntity, UsuarioEntity]),
  ],
  controllers: [PrestamoController],
  providers: [PrestamoService, LibraryAccessService],
  exports: [PrestamoService],
})
export class PrestamoModule {}
