import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UsuarioEntity } from './usuario.entity';

@Entity('reservas')
export class ReservaEntity {
  @PrimaryGeneratedColumn({ name: 'id_reserva' })
  idReserva!: number;

  @Column({ name: 'fecha_reserva', type: 'date' })
  fechaReserva!: string;

  @Column({ name: 'bloque_horario', type: 'varchar' })
  bloqueHorario!: string;

  @Column({ name: 'estado', type: 'varchar' })
  estado!: string;

  @Column({ name: 'motivo_cancelacion', type: 'varchar', nullable: true })
  motivoCancelacion!: string | null;

  @Column({ name: 'id_usuario', type: 'int' })
  idUsuario!: number;

  @Column({ name: 'id_sala', type: 'int' })
  idSala!: number;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: UsuarioEntity;
}