import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsuarioEntity } from './usuario.entity';
import { SalaEntity } from './sala.entity';
import { MultaEntity } from './multa.entity';

export enum EstadoReserva {
  ACTIVA = 'Activa',
  CANCELADA = 'Cancelada',
  FINALIZADA = 'Finalizada',
}

@Entity('reservas')
export class ReservaEntity {
  @PrimaryGeneratedColumn({ name: 'id_reserva' })
  idReserva!: number;

  // clave foranea usuario
  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: UsuarioEntity;

  // clave foranea sala
  @ManyToOne(() => SalaEntity)
  @JoinColumn({ name: 'id_sala' })
  sala!: SalaEntity;

  @ManyToOne(() => MultaEntity, { nullable: true })
  @JoinColumn({ name: 'id_multa' })
  multa?: MultaEntity;

  @Column({ name: 'fecha_reserva', type: 'date' })
  fechaReserva!: Date;

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio!: string;

  @Column({ name: 'hora_fin', type: 'time' })
  horaFin!: string;

  @Column({
    type: 'enum',
    enum: EstadoReserva,
    default: EstadoReserva.ACTIVA,
  })
  estado!: EstadoReserva;

  @Column({ name: 'motivo_cancelacion', length: 255, nullable: true })
  motivoCancelacion?: string;

  @Column({
    name: 'fecha_creacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaCreacion!: Date;
}
