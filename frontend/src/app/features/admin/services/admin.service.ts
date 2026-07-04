import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Forma del libro que retorna el backend para el admin
export interface ILibroAdmin {
  idLibro: number;
  titulo: string;
  autor: string;
  isbn: string;
  stockTotal: number;
  stockDisponible: number;
  disponible: boolean;
  estado: number;
}

// Forma del préstamo que retorna el backend para el admin (con relaciones usuario y libro)
export interface IPrestamoAdmin {
  idPrestamo: number;
  estado: number; // 1=ENTREGADO (activo), 2=FINALIZADO, 3=ATRASADO
  fechaPrestamo: string;
  fechaDevolucionEsperada: string;
  fechaDevolucionReal?: string;
  libro: {
    idLibro: number;
    titulo: string;
    autor: string;
  };
  usuario: {
    idUsuario: number;
    nombre: string;
    apellido: string;
    correo: string;
  };
}

// Forma de la sala que retorna el backend
export interface ISalaAdmin {
  idSala: number;
  nombreSala: string;
  capacidad: number;
  ubicacion: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Todos los libros del sistema — GET /libros
  getLibros(): Observable<ILibroAdmin[]> {
    return this.http.get<ILibroAdmin[]>(`${this.apiUrl}/libros`);
  }

  // Todos los préstamos con relaciones — GET /prestamos (requiere ADMIN)
  getPrestamos(): Observable<IPrestamoAdmin[]> {
    return this.http.get<IPrestamoAdmin[]>(`${this.apiUrl}/prestamos`);
  }

  // Préstamos en estado atrasado — GET /prestamos/atrasados (requiere ADMIN)
  getPrestamoAtrasados(): Observable<IPrestamoAdmin[]> {
    return this.http.get<IPrestamoAdmin[]>(`${this.apiUrl}/prestamos/atrasados`);
  }

  // Todas las salas del sistema — GET /reserve/salas
  getSalas(): Observable<ISalaAdmin[]> {
    return this.http.get<ISalaAdmin[]>(`${this.apiUrl}/reserve/salas`);
  }
}
