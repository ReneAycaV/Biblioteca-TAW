// Interfaz que refleja la ReservaEntity del backend
export interface IReserva {
  idReserva: number;
  idSala?: {
    idSala: number;
    nombreSala: string;
  };
  nombreSala?: string;
  fechaReserva: string;
  bloqueHorario: string | number;
  estado: string;
  motivoCancelacion?: string;
}
