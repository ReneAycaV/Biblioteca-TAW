import { ILibro } from './ilibro-detalle';

// Interfaz que refleja la PrestamoEntity del backend (con relación libro cargada)
export interface IPrestamo {
  idPrestamo: number;
  libro: ILibro;
  fechaPrestamo: Date;
  fechaDevolucionEsperada: Date;
  fechaDevolucionReal?: Date;
  estado: number; // EstadoPrestamo: 1=ACTIVO, 2=DEVUELTO, 3=VENCIDO, 4=PERDIDO
  observacion?: string;
}
