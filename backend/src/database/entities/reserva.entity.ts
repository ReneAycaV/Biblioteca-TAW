import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SalaEntity } from './sala.entity';
import { UsuarioEntity } from './usuario.entity';

export enum EstadoReserva {
  ACTIVA = 'Activa',
  CANCELADA = 'Cancelada',
  FINALIZADA = 'Finalizada',
}

export enum BloqueHorario {
  BLOQUE_1 = '1',
  BLOQUE_2 = '2',
  BLOQUE_3 = '3',
  BLOQUE_4 = '4',
  BLOQUE_5 = '5',
  BLOQUE_6 = '6',
  BLOQUE_7 = '7',
  BLOQUE_8 = '8',
  BLOQUE_9 = '9',
  BLOQUE_10 = '10',
  BLOQUE_11 = '11',
  BLOQUE_12 = '12',
  BLOQUE_13 = '13',
  BLOQUE_14 = '14',
  BLOQUE_A = 'A',
  BLOQUE_B = 'B',
  BLOQUE_C = 'C',
  BLOQUE_D = 'D',
  BLOQUE_E = 'E',
  BLOQUE_F = 'F',
  BLOQUE_G = 'G',
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
    type: 'enum',
    enum: BloqueHorario,
    name: 'bloque_horario',
  })
  bloqueHorario!: BloqueHorario;

  @Column({
    type: 'enum',
    enum: EstadoReserva,
    default: EstadoReserva.ACTIVA,
  })
  estado!: EstadoReserva;

  @Column({ name: 'motivo_cancelacion', length: 255, nullable: true })
  motivoCancelacion?: string;
}
