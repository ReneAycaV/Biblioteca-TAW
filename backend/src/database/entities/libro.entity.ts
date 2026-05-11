import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('libros')
export class LibroEntity {
  @PrimaryGeneratedColumn({ name: 'id_libro' })
  idLibro!: number;

  @Column({ length: 255 })
  titulo!: string;

  @Column({ length: 255 })
  autor!: string;

  @Column({ length: 13, unique: true })
  isbn!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ name: 'anio_publicacion', nullable: true })
  anioPublicacion?: number;

  @Column({ name: 'disponible', default: true })
  disponible!: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}
