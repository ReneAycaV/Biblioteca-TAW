import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReservaService } from '../../services/reservas.service';

@Component({
  selector: 'app-horario',
  templateUrl: './horario.component.html',
  styleUrls: ['./horario.component.css']
})
export class HorarioComponent implements OnInit {

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

  filtros = ['Todos', 'Estudio', 'Auditorio', 'Computación'];
  filtroActivo = 'Todos';
    // Datos simulados de salas disponibles para el Modal
  salasDisponibles = {
    estudio: [
      { id: 1, nombre: 'Sala 1-A', ubicacion: 'Aulario-A' },
      { id: 2, nombre: 'Sala 3-A', ubicacion: 'Aulario-A' },
      { id: 3, nombre: 'Sala 1-C', ubicacion: 'Aulario-C' }
    ],
    auditorio: [
      { id: 10, nombre: 'Sala 10', ubicacion: 'Auditorio Informatica' }
    ]
  };

  constructor(
    private reservaService: ReservaService,
    private router: Router
  ) {}

  ngOnInit() {
    // Si el alumno regresó de la página de detalles, recuperamos su filtro
    if (this.reservaService.datosTemporales.filtroActivo) {
      this.filtroActivo = this.reservaService.datosTemporales.filtroActivo;
    }
  }

  setFiltro(filtro: string) {
    this.filtroActivo = filtro;
    this.reservaService.datosTemporales.filtroActivo = filtro; // Lo guardamos en memoria
  }

  abrirModal(dia: string, hora: string) {
    // Guardamos el bloque en el servicio
    this.reservaService.guardarBloque(dia, hora);
    // Nota: El modal se abre automáticamente usando data-bs-toggle en el HTML
  }

  irADetalles(sala: any) {
    this.reservaService.guardarSala(sala);
    this.router.navigate(['/detalle-sala', sala.id]);
  }
}