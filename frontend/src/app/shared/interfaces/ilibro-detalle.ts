// Interfaz para el detalle completo de un libro — incluye campos que no muestra la tarjeta del catálogo
export interface ILibroDetalle {
  id: number;
  titulo: string;
  autor: string;
  anio: number;
  isbn: string;
  genero: string;
  descripcion: string;
  stockTotal: number;
  stockDisponible: number;
  estado: 'disponible' | 'prestado' | 'reservado';
  ubicacionFisica: string;
}
