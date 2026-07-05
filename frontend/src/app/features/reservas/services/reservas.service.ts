import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ISala } from '../../../shared/interfaces/isala';
import { EstadoSala } from '../../../shared/enums/estado-sala.enum';

@Injectable({
  providedIn: 'root',
})
export class ReservaService {
  private apiUrl = `${environment.apiUrl}/reserve`;

  // guardado temporal en el flujo de reserva (UI)
  datosTemporales = {
    dia: '',
    hora: '',
    salaSeleccionada: null,
    filtroActivo: 'Todos',
  };

  private horarioSeleccionado: any = null;

  constructor(private http: HttpClient) {}

  guardarBloque(dia: string, hora: string) {
    this.datosTemporales.dia = dia;
    this.datosTemporales.hora = hora;
  }

  guardarSala(sala: any) {
    this.datosTemporales.salaSeleccionada = sala;
  }

  guardarHorario(horario: any) {
    this.horarioSeleccionado = horario;
    console.log('Horario guardado en el Servicio:', this.horarioSeleccionado);
  }

  obtenerHorario() {
    return this.horarioSeleccionado;
  }

  crearReserva(reserva: {
    idSala: number;
    fechaReserva: string;
    bloqueHorario: number;
  }): Observable<any> {
    return this.http.post<any>(this.apiUrl, reserva);
  }

  getMisReservas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my`);
  }

  getSalas(): Observable<ISala[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/salas`)
      .pipe(map((salas) => salas.map((sala) => this.normalizarSala(sala))));
  }

  getSalaById(idSala: number): Observable<ISala> {
    return this.http
      .get<any>(`${this.apiUrl}/salas/${idSala}`)
      .pipe(map((sala) => this.normalizarSala(sala)));
  }

  private normalizarSala(sala: any): ISala {
    return {
      idSala: sala.idSala ?? sala.id_sala ?? sala.id,
      nombreSala: sala.nombreSala ?? sala.nombre_sala ?? sala.nombre,
      capacidad: sala.capacidad ?? sala.capacidad_sala ?? 0,
      ubicacion: this.getUbicacionTexto(sala.ubicacion ?? sala.ubicacion_sala),
      estado: this.getEstadoTexto(sala.estado ?? sala.estado_sala),
    };
  }

  private getUbicacionTexto(ubicacion: number | string): string {
    const ubicaciones: Record<number, string> = {
      1: 'Biblioteca',
      2: 'Aulario A',
      3: 'Aulario C',
      4: 'Cafeteria A',
      5: 'Cafeteria B',
      6: 'Auditorio',
    };

    if (typeof ubicacion === 'number') {
      return ubicaciones[ubicacion] ?? 'Sin ubicacion';
    }

    return ubicacion || 'Sin ubicacion';
  }

  private getEstadoTexto(estado: number | string): EstadoSala {
    const estados: Record<number, EstadoSala> = {
      1: EstadoSala.DISPONIBLE,
      2: EstadoSala.MANTENIMIENTO,
      3: EstadoSala.BLOQUEADA,
    };

    if (typeof estado === 'number') {
      return estados[estado] ?? EstadoSala.BLOQUEADA;
    }

    return (estado as EstadoSala) || EstadoSala.BLOQUEADA;
  }
}
