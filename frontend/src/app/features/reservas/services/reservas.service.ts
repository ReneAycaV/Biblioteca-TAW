import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
// guardado
  datosTemporales = {
    dia: '',
    hora: '',
    salaSeleccionada: null,
    filtroActivo: 'Todos'
  };

  guardarBloque(dia: string, hora: string) {
    this.datosTemporales.dia = dia;
    this.datosTemporales.hora = hora;
  }

  guardarSala(sala: any) {
    this.datosTemporales.salaSeleccionada = sala;
  }
}