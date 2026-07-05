import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Repository } from 'typeorm';

import {
  PrestamoEntity,
  EstadoPrestamo,
} from '../database/entities/prestamo.entity';
import { EstadoLibro, LibroEntity } from '../database/entities/libro.entity';
import { LibraryAccessService } from './library-access.service';

const ESTADO_PRESTAMO = {
  ENTREGADO: 1,
  FINALIZADO: 2,
  ATRASADO: 3,
};

@Injectable()
export class PrestamosService {
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
    const usuario =
      await this.libraryAccessService.validateNoPendingFines(userId);

    return this.prestamoRepository.manager.transaction(async (manager) => {
      const libroRepository = manager.getRepository(LibroEntity);
      const prestamoRepository = manager.getRepository(PrestamoEntity);

      const libro = await libroRepository.findOne({
        where: { idLibro },
        lock: { mode: 'pessimistic_write' },
      });

      if (!libro) {
        throw new NotFoundException('Libro no encontrado');
      }

      const libroDisponible =
        libro.estado === EstadoLibro.DISPONIBLE && libro.stockDisponible > 0;

      if (!libroDisponible) {
        throw new ForbiddenException(
          'El libro no está disponible para préstamo',
        );
      }

      const prestamoPendiente = await prestamoRepository.findOne({
        where: {
          usuario: { idUsuario: userId },
          libro: { idLibro },
          estado: In([EstadoPrestamo.ACTIVO, EstadoPrestamo.VENCIDO]),
        },
      });

      if (prestamoPendiente) {
        throw new ForbiddenException(
          'Ya tienes un préstamo pendiente de este libro',
        );
      }

      const fechaPrestamo = new Date();
      const fechaDevolucionEsperada = new Date();
      fechaDevolucionEsperada.setDate(fechaPrestamo.getDate() + 14);

      const prestamo = prestamoRepository.create({
        usuario,
        libro,
        fechaPrestamo,
        fechaDevolucionEsperada,
        estado: EstadoPrestamo.ACTIVO,
      });

      libro.stockDisponible -= 1;
      libro.estado =
        libro.stockDisponible > 0
          ? EstadoLibro.DISPONIBLE
          : EstadoLibro.PRESTADO;
      libro.disponible = libro.estado === EstadoLibro.DISPONIBLE;

      await libroRepository.save(libro);

      return prestamoRepository.save(prestamo);
    });
  }

  async devolverPrestamo(
    userId: number,
    idPrestamo: number,
  ): Promise<PrestamoEntity> {
    return this.prestamoRepository.manager.transaction(async (manager) => {
      const libroRepository = manager.getRepository(LibroEntity);
      const prestamoRepository = manager.getRepository(PrestamoEntity);

      const prestamo = await prestamoRepository.findOne({
        where: {
          idPrestamo,
          usuario: { idUsuario: userId },
          estado: In([EstadoPrestamo.ACTIVO, EstadoPrestamo.VENCIDO]),
        },
        relations: {
          libro: true,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!prestamo) {
        throw new NotFoundException('Prestamo activo no encontrado');
      }

      const libro = await libroRepository.findOne({
        where: { idLibro: prestamo.libro.idLibro },
        lock: { mode: 'pessimistic_write' },
      });

      if (!libro) {
        throw new NotFoundException('Libro no encontrado');
      }

      prestamo.estado = EstadoPrestamo.DEVUELTO;
      prestamo.fechaDevolucionReal = new Date();

      libro.stockDisponible = Math.min(
        libro.stockDisponible + 1,
        libro.stockTotal,
      );
      libro.estado =
        libro.stockDisponible > 0
          ? EstadoLibro.DISPONIBLE
          : EstadoLibro.PRESTADO;
      libro.disponible = libro.estado === EstadoLibro.DISPONIBLE;

      await libroRepository.save(libro);

      return prestamoRepository.save(prestamo);
    });
  }

  async findAll() {
    return this.prestamoRepository.find({
      relations: {
        usuario: true,
        libro: true,
      },
      order: {
        idPrestamo: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const prestamo = await this.prestamoRepository.findOne({
      where: { idPrestamo: id },
      relations: {
        usuario: true,
        libro: true,
      },
    });

    if (!prestamo) {
      throw new NotFoundException('Préstamo no encontrado');
    }

    return prestamo;
  }

  async marcarComoEntregado(id: number) {
    const prestamo = await this.findOne(id);

    if (prestamo.estado === ESTADO_PRESTAMO.FINALIZADO) {
      throw new BadRequestException(
        'No se puede entregar un préstamo ya finalizado',
      );
    }

    prestamo.estado = ESTADO_PRESTAMO.ENTREGADO;

    if (!prestamo.fechaRetiro) {
      prestamo.fechaRetiro = new Date();
    }

    if (!prestamo.fechaPrestamo) {
      prestamo.fechaPrestamo = new Date();
    }

    return this.prestamoRepository.save(prestamo);
  }

  async finalizarPrestamo(id: number) {
    const prestamo = await this.findOne(id);

    if (prestamo.estado === ESTADO_PRESTAMO.FINALIZADO) {
      throw new BadRequestException('Este préstamo ya fue finalizado');
    }

    prestamo.estado = ESTADO_PRESTAMO.FINALIZADO;
    prestamo.fechaDevolucionReal = new Date();

    const libro = await this.libroRepository.findOne({
      where: { idLibro: prestamo.libro.idLibro },
    });

    if (libro) {
      if (libro.stockDisponible < libro.stockTotal) {
        libro.stockDisponible += 1;
      }

      libro.disponible = libro.estado === 1 && libro.stockDisponible > 0;

      await this.libroRepository.save(libro);
    }

    return this.prestamoRepository.save(prestamo);
  }

  async marcarAtrasados() {
    const prestamos = await this.prestamoRepository.find({
      where: {
        fechaDevolucionEsperada: LessThan(new Date()),
        fechaDevolucionReal: IsNull(),
      },
    });

    for (const prestamo of prestamos) {
      prestamo.estado = ESTADO_PRESTAMO.ATRASADO;
    }

    return this.prestamoRepository.save(prestamos);
  }

  async listarAtrasados() {
    return this.prestamoRepository.find({
      where: {
        estado: ESTADO_PRESTAMO.ATRASADO,
      },
      relations: {
        usuario: true,
        libro: true,
      },
      order: {
        fechaDevolucionEsperada: 'ASC',
      },
    });
  }

  async obtenerFechas(id: number) {
    const prestamo = await this.findOne(id);

    return {
      idPrestamo: prestamo.idPrestamo,
      estado: prestamo.estado,
      fechaPrestamo: prestamo.fechaPrestamo,
      fechaRetiro: prestamo.fechaRetiro,
      fechaDevolucionEsperada: prestamo.fechaDevolucionEsperada,
      fechaDevolucionReal: prestamo.fechaDevolucionReal,
    };
  }
}
