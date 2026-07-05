import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsuarioEntity } from './usuario.entity';
import { SalaEntity } from './sala.entity';

export enum EstadoReserva {
  ACTIVA = 1,
  CANCELADA = 2,
  FINALIZADA = 3,
}

export enum BloqueHorario {
  A = 1,
  B = 2,
  C = 3,
  D = 4,
  E = 5,
  F = 6,
  G = 7,
  H = 8,
  I = 9,
  J = 10,
  K = 11,
}
@Entity('reservas')
export class ReservaEntity {
  @PrimaryGeneratedColumn({ name: 'id_reserva' })
  idReserva!: number;

  // clave foranea usuario
  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'id_usuario' })
  idUsuario!: UsuarioEntity;

  // clave foranea sala
  @ManyToOne(() => SalaEntity)
  @JoinColumn({ name: 'id_sala' })
  idSala!: SalaEntity;

  @Column({ name: 'fecha_reserva', type: 'date' })
  fechaReserva!: Date;

  @Column({
    type: 'smallint',
    name: 'bloque_horario',
  })
  bloqueHorario!: BloqueHorario;

  @Column({
    type: 'smallint',
    default: EstadoReserva.ACTIVA,
  })
  estado!: EstadoReserva;

  @Column({ name: 'motivo_cancelacion', length: 255, nullable: true })
  motivoCancelacion?: string;

  @Column({ name: 'nombre_sala', length: 100 })
  nombreSala!: string;
}
