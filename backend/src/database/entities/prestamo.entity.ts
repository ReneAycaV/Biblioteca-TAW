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
  ACTIVO = 1,
  DEVUELTO = 2,
  VENCIDO = 3,
  PERDIDO = 4
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

  @ManyToOne(() => MultaEntity, { nullable: true })
  @JoinColumn({ name: 'id_multa' })
  multa?: MultaEntity;

  @Column({ name: 'fecha_prestamo' })
  fechaPrestamo!: Date;

  @Column({ name: 'fecha_devolucion_esperada' })
  fechaDevolucionEsperada!: Date;

  @Column({ name: 'fecha_devolucion_real', nullable: true })
  fechaDevolucionReal?: Date;

  @Column({
    type: 'smallint',
    enum: EstadoPrestamo,
    default: EstadoPrestamo.ACTIVO,
  })
  estado!: EstadoPrestamo;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;


}