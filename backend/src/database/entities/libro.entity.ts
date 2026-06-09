import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum EstadoLibro {
  DISPONIBLE = 1,
  PRESTADO = 2,
  MANTENIMIENTO = 3,
  EXTRAVIADO = 4,
}

@Entity('libros')
export class LibroEntity {
  @PrimaryGeneratedColumn({ name: 'id_libros' })
  idLibro!: number;

  @Column({ length: 255 })
  titulo!: string;

  @Column({ length: 255 })
  autor!: string;

  @Column({ length: 13, unique: true })
  isbn!: string;

  @Column({ length: 150, nullable: true })
  editorial?: string;

  @Column({ length: 100, nullable: true })
  categoria?: string;

  @Column({ name: 'anio', type: 'date', nullable: true })
  anio?: Date;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ name: 'stock_disponible', type: 'int', default: 0 })
  stockDisponible!: number;

  @Column({ name: 'stock_total', type: 'int', default: 0 })
  stockTotal!: number;

  @Column({ name: 'valor_libro', type: 'decimal', precision: 10, scale: 2,default: 25000, })
  valorLibro!: number;

  @Column({
    type: 'smallint',
    enum: EstadoLibro,
    default: EstadoLibro.DISPONIBLE,
  })
  estado!: EstadoLibro;

  @Column({ name: 'ubicacion_fisica', length: 120, nullable: true })
  ubicacionFisica?: string;

  @Column({ name: 'disponible', default: true })
  disponible!: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}