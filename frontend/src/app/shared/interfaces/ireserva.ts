// Interfaz que refleja la ReservaEntity del backend
export interface IReserva {
  idReserva: number;
  idSala?: {
    idSala: number;
    nombreSala: string;
  };
  nombreSala?: string;
  fechaReserva: string;
  bloqueHorario: number;
  estado: number; // 1=ACTIVA, 2=CANCELADA, 3=FINALIZADA
  motivoCancelacion?: string;
}
