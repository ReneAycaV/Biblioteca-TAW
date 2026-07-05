// DTO enviado al backend para crear una reserva (POST /reserve)
export interface ICreateReservaDTO {
  idSala: number;
  fechaReserva: string;
  bloqueHorario: string;
}
