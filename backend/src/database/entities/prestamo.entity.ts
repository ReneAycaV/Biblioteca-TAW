import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsuarioEntity } from './usuario.entity';
import { LibroEntity } from './libro.entity';

export enum EstadoPrestamo {
  ACTIVO = 'ACTIVO',
  DEVUELTO = 'DEVUELTO',
  VENCIDO = 'VENCIDO',
}

@Entity('prestamos')
export class PrestamoEntity {
  @PrimaryGeneratedColumn({ name: 'id_prestamo' })
  idPrestamo!: number;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: UsuarioEntity;

  @ManyToOne(() => LibroEntity)
  @JoinColumn({ name: 'id_libro' })
  libro!: LibroEntity;

  @Column({ name: 'fecha_prestamo' })
  fechaPrestamo!: Date;

  @Column({ name: 'fecha_devolucion_esperada' })
  fechaDevolucionEsperada!: Date;

  @Column({ name: 'fecha_devolucion_real', nullable: true })
  fechaDevolucionReal?: Date;

  @Column({
    type: 'enum',
    enum: EstadoPrestamo,
    default: EstadoPrestamo.ACTIVO,
  })
  estado!: EstadoPrestamo;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}
