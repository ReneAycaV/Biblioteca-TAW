import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum EstadoSala {
  DISPONIBLE = 1,
  MANTENIMIENTO = 2,
  BLOQUEADA = 3,
}

export enum UbicacionSala {
  BIBLIOTECA = 1,
  AULARIO_A = 2,
  AULARIO_C = 3,
  CAFETERIA_A = 4,
  CAFETERIA_B = 5,
  AUDITORIO_INF = 6,
}

@Entity('salas')
export class SalaEntity {
  @PrimaryGeneratedColumn({ name: 'id_sala' })
  idSala!: number;

  @Column({ name: 'nombre_sala', length: 50 })
  nombreSala!: string;

  @Column({ name: 'capacidad_sala', type: 'int' })
  capacidad!: number;

  // Equipamiento y ambiente de la sala (pizarra, proyector, silencio, etc.).
  // El recomendador con IA la usa para elegir la sala que mejor calza con lo pedido.
  @Column({ name: 'descripcion_sala', type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({
    type: 'smallint',
    name: 'ubicacion_sala',
  })
  ubicacion!: UbicacionSala;

  @Column({
    type: 'smallint',
    name: 'estado_sala',
    default: EstadoSala.DISPONIBLE,
  })
  estado!: EstadoSala;
}
