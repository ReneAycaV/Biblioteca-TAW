import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ISala } from '../../../shared/interfaces/isala';
import { ICreateReservaDTO } from '../../../shared/dtos/reserva/create-reserva.dto';

@Injectable({
  providedIn: 'root',
})
export class ReservaService {
  private apiUrl = `${environment.apiUrl}/reserve`;
  private readonly horarioStorageKey = 'reserva.horarioSeleccionado';

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
    sessionStorage.setItem(this.horarioStorageKey, JSON.stringify(horario));
    console.log('Horario guardado en el Servicio:', this.horarioSeleccionado);
  }

  obtenerHorario() {
    if (!this.horarioSeleccionado) {
      const horarioGuardado = sessionStorage.getItem(this.horarioStorageKey);
      this.horarioSeleccionado = horarioGuardado
        ? JSON.parse(horarioGuardado)
        : null;
    }

    return this.horarioSeleccionado;
  }

  limpiarHorario() {
    this.horarioSeleccionado = null;
    sessionStorage.removeItem(this.horarioStorageKey);
  }

  crearReserva(reserva: ICreateReservaDTO): Observable<any> {
    return this.http.post<any>(this.apiUrl, reserva);
  }

  getMisReservas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my`);
  }

  getSalas(): Observable<ISala[]> {
    return this.http.get<ISala[]>(`${this.apiUrl}/salas`);
  }

  getSalaById(idSala: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/salas/${idSala}`);
  }
}
