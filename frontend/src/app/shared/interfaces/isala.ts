import { EstadoSala } from '../enums/estado-sala.enum';

// Interfaz que refleja la SalaEntity del backend
export interface ISala {
  idSala: number;
  nombreSala: string;
  capacidad: number;
  ubicacion: string;
  estado: EstadoSala;
}
