import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-horario',
  templateUrl: './horario.component.html',
  styleUrls: ['./horario.component.css']
})
export class HorarioComponent {

  @Output() horarioSeleccionado = new EventEmitter<any>();

  // Las columnas de tu tabla
  dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  
  // Las filas de tu tabla (basado en tu imagen)
  horas = [
    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', 
    '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00'
  ];

  // Aquí guardaremos el bloque que el alumno pinchó
  seleccionActual: any = null;

  // Una lista "quemada" para simular bloques que ya no tienen salas disponibles
  bloquesAgotados = [
    'Lunes-10:00 - 11:00', 
    'Miércoles-08:00 - 09:00',
    'Jueves-12:00 - 13:00'
  ];

  // 1. Al hacer clic en una celda
  seleccionarCelda(dia: string, hora: string) {
    const idBloque = `${dia}-${hora}`;
    
    // Si está agotado, ignoramos el clic
    if (this.bloquesAgotados.includes(idBloque)) {
      return; 
    }

    // Si está disponible, lo guardamos como el seleccionado
    this.seleccionActual = { dia, hora };
  }

  // 2. Para pintar la celda en el HTML
  esSeleccionado(dia: string, hora: string): boolean {
    return this.seleccionActual?.dia === dia && this.seleccionActual?.hora === hora;
  }

  esAgotado(dia: string, hora: string): boolean {
    return this.bloquesAgotados.includes(`${dia}-${hora}`);
  }

}