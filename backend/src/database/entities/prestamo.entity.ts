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
import { MultaEntity } from './multa.entity';

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
  @JoinColumn({ name: 'id_libros' })
  libro!: LibroEntity;

  @ManyToOne(() => MultaEntity, { nullable: true })
  @JoinColumn({ name: 'id_multa' })
  multa?: MultaEntity;

  @Column({ name: 'fecha_prestamo', type: 'date' })
  fechaPrestamo!: Date;

  @Column({ name: 'fecha_devolucion_esperada', type: 'date' })
  fechaDevolucionEsperada!: Date;

  @Column({ name: 'fecha_devolucion_real', type: 'date', nullable: true })
  fechaDevolucionReal?: Date;

  @Column({
    type: 'enum',
    enum: EstadoPrestamo,
    default: EstadoPrestamo.ACTIVO,
  })
  estado!: EstadoPrestamo;

  @Column({ type: 'text', nullable: true })
  observacion?: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}
