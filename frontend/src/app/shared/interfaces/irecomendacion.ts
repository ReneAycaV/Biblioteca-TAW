import { ILibro } from './ilibro-detalle';

// "ia" = respuesta generada con Claude; "respaldo" = reglas sin IA
export type ModoRecomendacion = 'ia' | 'respaldo';

// ── Propuesta A · recomendador de salas ──
export interface ISalaRecomendada {
  idSala: number;
  nombreSala: string;
  capacidad: number;
  ubicacion: string;
  descripcion: string | null;
  bloque: number;
  bloqueLetra: string;
  inicio: string;
  fin: string;
  puntaje: number;
  motivo: string;
  reservasHistoricas: number;
}

export interface IRecomendacionSalasResponse {
  modo: ModoRecomendacion;
  consulta: string;
  fecha: string;
  criterios: {
    personas: number | null;
    bloques: string[];
    ubicaciones: string[];
    preferirBajaDemanda: boolean;
  };
  explicacion: string;
  avisos: string[];
  recomendaciones: ISalaRecomendada[];
}

// ── Propuesta B · recomendador y búsqueda de libros ──
export interface ILibroRecomendado {
  libro: ILibro;
  motivo: string;
  puntaje: number;
}

export interface IRecomendacionesLibrosResponse {
  modo: ModoRecomendacion;
  tipo: 'historial' | 'populares';
  basadoEn: string[];
  recomendaciones: ILibroRecomendado[];
}

export interface IBusquedaInteligenteResponse {
  modo: ModoRecomendacion;
  consulta: string;
  resultados: ILibroRecomendado[];
}
