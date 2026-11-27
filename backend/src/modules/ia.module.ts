import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// entidades
import { ReservaEntity } from '../database/entities/reserva.entity';
import { SalaEntity } from '../database/entities/sala.entity';
import { UsuarioEntity } from '../database/entities/usuario.entity';
import { LibroEntity } from '../database/entities/libro.entity';
import { PrestamoEntity } from '../database/entities/prestamo.entity';

// controladores
import { RecomendadorSalasController } from '../controllers/ia/recomendador-salas.controller';
import { RecomendadorLibrosController } from '../controllers/ia/recomendador-libros.controller';

// servicios
import { IaService } from '../providers/ia.service';
import { RecomendadorSalasService } from '../providers/recomendador-salas.service';
import { RecomendadorLibrosService } from '../providers/recomendador-libros.service';
import { LibraryAccessService } from '../providers/library-access.service';
import { ReserveModule } from './reserve.module';

/**
 * Módulo de tecnología avanzada: recomendadores con IA (API de Claude)
 * con modo de respaldo por reglas cuando no hay clave o la IA falla.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReservaEntity,
      SalaEntity,
      UsuarioEntity,
      LibroEntity,
      PrestamoEntity,
    ]),
    ReserveModule, // exporta ReserveRoomService (lógica de demanda)
  ],
  controllers: [RecomendadorSalasController, RecomendadorLibrosController],
  providers: [
    IaService,
    RecomendadorSalasService,
    RecomendadorLibrosService,
    LibraryAccessService,
  ],
})
export class IaModule {}
