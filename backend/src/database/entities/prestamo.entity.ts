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

@Entity('prestamos')
export class PrestamoEntity {
  @PrimaryGeneratedColumn({ name: 'id_prestamo' })
  idPrestamo!: number;

  @Column({ name: 'fecha_prestamo', type: 'timestamp' })
  fechaPrestamo!: Date;

  @Column({ name: 'fecha_devolucion_esperada', type: 'timestamp' })
  fechaDevolucionEsperada!: Date;

  @Column({ name: 'fecha_devolucion_real', type: 'timestamp', nullable: true })
  fechaDevolucionReal!: Date | null;

  @Column({ name: 'estado', type: 'int2' })
  estado!: number;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp' })
  fechaCreacion!: Date;

  @Column({ name: 'id_usuario', type: 'int' })
  idUsuario!: number;

  @Column({ name: 'id_libro', type: 'int' })
  idLibro!: number;

  @Column({ name: 'id_multa', type: 'int', nullable: true })
  idMulta!: number | null;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: UsuarioEntity;

  @ManyToOne(() => LibroEntity)
  @JoinColumn({ name: 'id_libro' })
  libro!: LibroEntity;
}