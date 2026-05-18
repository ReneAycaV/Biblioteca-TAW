import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum EstadoPagoMulta {
  PENDIENTE = 'PENDIENTE',
  PAGADA = 'PAGADA',
  ANULADA = 'ANULADA',
}

@Entity('multas')
export class MultaEntity {
  @PrimaryGeneratedColumn({ name: 'id_multa' })
  idMulta!: number;

  @Column({ type: 'int' })
  monto!: number;

  @Column({ name: 'dias_atraso', type: 'int' })
  diasAtraso!: number;

  @Column({
    name: 'estado_pago',
    type: 'enum',
    enum: EstadoPagoMulta,
    default: EstadoPagoMulta.PENDIENTE,
  })
  estadoPago!: EstadoPagoMulta;

  @Column({ name: 'fecha_generacion', type: 'date' })
  fechaGeneracion!: Date;

  @Column({ name: 'fecha_pago', type: 'date', nullable: true })
  fechaPago?: Date;
}
