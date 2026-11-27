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
  editorial: string | null;
  categoria: string | null;
  anio: string | null;
  descripcion: string | null;
  stockTotal: number;
  stockDisponible: number;
  valorLibro: number | string;
  ubicacionFisica: string | null;
  disponible: boolean;
  estado: number; // 0=INACTIVO, 1=DISPONIBLE, 2=SIN_STOCK, 3=MANTENIMIENTO, 4=EXTRAVIADO
}

export interface ILibroPayload {
  titulo: string;
  autor: string;
  isbn: string;
  editorial?: string;
  categoria?: string;
  anio?: string;
  descripcion?: string;
  stockTotal: number;
  stockDisponible: number;
  valorLibro: number;
  ubicacionFisica?: string;
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
  descripcion: string | null;
  ubicacion: string;
  estado: string;
}

export interface ISalaPayload {
  nombreSala: string;
  capacidad: number;
  descripcion: string;
  ubicacion: string;
  estado: string;
}

export type RolUsuarioAdmin = 'ADMIN' | 'ESTUDIANTE';

export interface IUsuarioAdmin {
  idUsuario: number;
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  rol: RolUsuarioAdmin;
  telefono?: string | null;
  estadoAcademico: string; // 'activo' | 'inactivo'
  tieneMultaImpaga: boolean;
  fechaCreacion: string;
}

export interface IUsuarioPayload {
  nombre?: string;
  apellido?: string;
  rut?: string;
  correo?: string;
  password?: string;
  rol?: RolUsuarioAdmin;
  telefono?: string;
  estadoAcademico?: string;
}

export interface IMultaAdmin {
  idMulta: number;
  estadoPago: 'pendiente' | 'pagada';
  requiereDecision: boolean;
  monto: number | null;
  diasAtraso: number;
  estadoLibro: 'no_devuelto' | 'devuelto_bueno' | 'perdido_total';
  fechaGeneracion: string;
  fechaPago: string | null;
  observaciones: string | null;
  prestamo: {
    idPrestamo: number;
    estado: number;
    fechaPrestamo: string;
    fechaDevolucionEsperada: string;
    fechaDevolucionReal: string | null;
  };
  libro: { idLibro: number; titulo: string; autor: string; valorLibro: number };
  usuario: {
    idUsuario: number;
    nombre: string;
    apellido: string;
    correo: string;
    rut: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ───────── Libros ─────────
  getLibros(): Observable<ILibroAdmin[]> {
    return this.http.get<ILibroAdmin[]>(`${this.apiUrl}/libros`);
  }

  crearLibro(libro: ILibroPayload): Observable<ILibroAdmin> {
    return this.http.post<ILibroAdmin>(`${this.apiUrl}/libros`, libro);
  }

  actualizarLibro(id: number, libro: Partial<ILibroPayload>): Observable<ILibroAdmin> {
    return this.http.patch<ILibroAdmin>(`${this.apiUrl}/libros/${id}`, libro);
  }

  activarLibro(id: number): Observable<ILibroAdmin> {
    return this.http.patch<ILibroAdmin>(`${this.apiUrl}/libros/${id}/activar`, {});
  }

  desactivarLibro(id: number): Observable<ILibroAdmin> {
    return this.http.patch<ILibroAdmin>(`${this.apiUrl}/libros/${id}/desactivar`, {});
  }

  // ───────── Préstamos ─────────
  getPrestamos(): Observable<IPrestamoAdmin[]> {
    return this.http.get<IPrestamoAdmin[]>(`${this.apiUrl}/prestamos`);
  }

  getPrestamoAtrasados(): Observable<IPrestamoAdmin[]> {
    return this.http.get<IPrestamoAdmin[]>(`${this.apiUrl}/prestamos/atrasados`);
  }

  // ───────── Salas ─────────
  getSalas(): Observable<ISalaAdmin[]> {
    return this.http.get<ISalaAdmin[]>(`${this.apiUrl}/reserve/salas`);
  }

  crearSala(sala: ISalaPayload): Observable<ISalaAdmin> {
    return this.http.post<ISalaAdmin>(`${this.apiUrl}/reserve/salas`, sala);
  }

  actualizarSala(id: number, sala: Partial<ISalaPayload>): Observable<ISalaAdmin> {
    return this.http.put<ISalaAdmin>(`${this.apiUrl}/reserve/salas/${id}`, sala);
  }

  eliminarSala(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/reserve/salas/${id}`);
  }

  // ───────── Usuarios ─────────
  getUsuarios(): Observable<IUsuarioAdmin[]> {
    return this.http.get<IUsuarioAdmin[]>(`${this.apiUrl}/usuarios`);
  }

  crearUsuario(usuario: IUsuarioPayload): Observable<IUsuarioAdmin> {
    return this.http.post<IUsuarioAdmin>(`${this.apiUrl}/usuarios`, usuario);
  }

  actualizarUsuario(id: number, usuario: IUsuarioPayload): Observable<IUsuarioAdmin> {
    return this.http.patch<IUsuarioAdmin>(`${this.apiUrl}/usuarios/${id}`, usuario);
  }

  cambiarEstadoUsuario(id: number, estadoAcademico: string): Observable<IUsuarioAdmin> {
    return this.http.patch<IUsuarioAdmin>(`${this.apiUrl}/usuarios/${id}/estado`, { estadoAcademico });
  }

  // ───────── Multas ─────────
  getMultas(): Observable<IMultaAdmin[]> {
    return this.http.get<IMultaAdmin[]>(`${this.apiUrl}/admin/multas`);
  }

  resolverMulta(id: number, estado: 'BUENO' | 'PERDIDO'): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/admin/multas/${id}/resolver`, { estado });
  }

  condonarMulta(id: number, motivo: string): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/admin/multas/${id}/condonar`, { motivo });
  }

  // Convierte un error HTTP de NestJS en un mensaje legible
  mensajeError(err: any, porDefecto = 'Ocurrió un error inesperado'): string {
    const msg = err?.error?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    if (err?.status === 0) return 'No se pudo conectar con el servidor';
    if (err?.status === 403) return 'No tienes permisos de administrador';
    return porDefecto;
  }
}
