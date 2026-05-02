import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PrestamoEntity,
  EstadoPrestamo,
} from '../database/entities/prestamo.entity';
import { UsuarioEntity } from '../database/entities/usuario.entity';
import { LibroEntity } from '../database/entities/libro.entity';
import { LibraryAccessService } from './library-access.service';

@Injectable()
export class PrestamoService {
  constructor(
    @InjectRepository(PrestamoEntity)
    private readonly prestamoRepository: Repository<PrestamoEntity>,
    @InjectRepository(LibroEntity)
    private readonly libroRepository: Repository<LibroEntity>,
    private readonly libraryAccessService: LibraryAccessService,
  ) {}

  async solicitarPrestamo(
    userId: number,
    idLibro: number,
  ): Promise<PrestamoEntity> {
    // Validar que el usuario esté activo y sin multas
    const usuario =
      await this.libraryAccessService.validateAcademicStatus(userId);

    // Verificar que el libro existe y está disponible
    const libro = await this.libroRepository.findOne({
      where: { idLibro },
    });

    if (!libro) {
      throw new NotFoundException('Libro no encontrado');
    }

    if (!libro.disponible) {
      throw new ForbiddenException('El libro no está disponible para préstamo');
    }

    // Verificar que el usuario no tenga préstamos activos del mismo libro
    const prestamoActivo = await this.prestamoRepository.findOne({
      where: {
        usuario: { idUsuario: userId },
        libro: { idLibro },
        estado: EstadoPrestamo.ACTIVO,
      },
    });

    if (prestamoActivo) {
      throw new ForbiddenException(
        'Ya tienes un préstamo activo de este libro',
      );
    }

    // Crear el préstamo
    const fechaPrestamo = new Date();
    const fechaDevolucionEsperada = new Date();
    fechaDevolucionEsperada.setDate(fechaPrestamo.getDate() + 14); // 14 días por defecto

    const prestamo = this.prestamoRepository.create({
      usuario,
      libro,
      fechaPrestamo,
      fechaDevolucionEsperada,
      estado: EstadoPrestamo.ACTIVO,
    });

    // Marcar el libro como no disponible
    libro.disponible = false;
    await this.libroRepository.save(libro);

    return await this.prestamoRepository.save(prestamo);
  }
}
