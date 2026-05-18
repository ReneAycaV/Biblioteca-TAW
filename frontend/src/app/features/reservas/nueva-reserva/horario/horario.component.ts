import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-horario',
  templateUrl: './horario.component.html',
  styleUrls: ['./horario.component.css']
})
export class HorarioComponent {

  @Output() horarioSeleccionado = new EventEmitter<any>();

  dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  horas = [
    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', 
    '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00'
  ];

  seleccionActual: any = null;

  bloquesAgotados = [
    'Lunes-10:00 - 11:00', 
    'Miércoles-08:00 - 09:00',
    'Jueves-12:00 - 13:00'
  ];

  seleccionarCelda(dia: string, hora: string) {
    const idBloque = `${dia}-${hora}`;
    
    if (this.bloquesAgotados.includes(idBloque)) {
      return; 
    }
    this.seleccionActual = { dia, hora };
  }

  esSeleccionado(dia: string, hora: string): boolean {
    return this.seleccionActual?.dia === dia && this.seleccionActual?.hora === hora;
  }

  esAgotado(dia: string, hora: string): boolean {
    return this.bloquesAgotados.includes(`${dia}-${hora}`);
  }

}