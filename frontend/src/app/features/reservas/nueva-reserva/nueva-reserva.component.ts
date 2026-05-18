import { Component } from '@angular/core';

@Component({
  selector: 'app-nueva-reserva',
  templateUrl: './nueva-reserva.component.html',
  styleUrls: ['./nueva-reserva.component.css']
})
export class NuevaReservaComponent {
  
  // Usaremos un número para controlar la vista: 1=Horario, 2=Salas, 3=Confirmación
  vistaActual: number = 1;

  // El "carrito de compras" donde guardaremos todo antes de mandarlo al backend
  datosReserva = {
    horarioElegido: null,
    salaElegida: null
  };

  // --- FUNCIONES PARA AVANZAR ---

  // El hijo 'horario' llamará a esta función cuando el alumno seleccione un bloque
  avanzarASalas(horario: any) {
    this.datosReserva.horarioElegido = horario;
    console.log("Horario guardado:", this.datosReserva.horarioElegido);
    this.vistaActual = 2; // Cambiamos a la vista de salas
  }

  // El hijo 'salas' llamará a esta función cuando el alumno seleccione la tarjeta
  avanzarAConfirmacion(sala: any) {
    this.datosReserva.salaElegida = sala;
    console.log("Sala guardada:", this.datosReserva.salaElegida);
    this.vistaActual = 3; // Cambiamos a la vista final
  }

  // --- FUNCIÓN PARA RETROCEDER ---
  volver(vistaDestino: number) {
    this.vistaActual = vistaDestino;
  }
}