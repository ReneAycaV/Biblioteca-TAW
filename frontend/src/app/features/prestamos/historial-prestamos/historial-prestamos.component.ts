import { Component, OnInit } from '@angular/core';

// Interfaz con prefijo I según convención del ramo
export interface IHistorialItem {
  id: number;
  tipo: 'prestamo' | 'reserva';
  titulo: string;         // título del libro (préstamo) o nombre de la sala (reserva)
  fechaRetiro: Date;
  fechaDevolucion: Date;
  estado: 'activo' | 'finalizado';
}

@Component({
  selector: 'app-historial-prestamos',
  templateUrl: './historial-prestamos.component.html',
  styleUrls: ['./historial-prestamos.component.css']
})
export class HistorialPrestamosComponent implements OnInit {

  // Lista completa sin filtrar
  todosLosItems: IHistorialItem[] = [];

  // Chip activo: 'todos' | 'prestamos' | 'reservas'
  filtroActivo: 'todos' | 'prestamos' | 'reservas' = 'todos';

  // Constructor: solo inyección de dependencias
  constructor() {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // Carga datos mock — se reemplazará con llamada al servicio cuando el backend esté conectado
  cargarDatos(): void {
    this.todosLosItems = [
      {
        id: 1,
        tipo: 'prestamo',
        titulo: 'Cien años de soledad',
        fechaRetiro: new Date('2026-04-30'),
        fechaDevolucion: new Date('2026-05-14'),
        estado: 'finalizado'
      },
      {
        id: 2,
        tipo: 'reserva',
        titulo: 'Sala de estudio A-201',
        fechaRetiro: new Date('2026-06-09'),
        fechaDevolucion: new Date('2026-06-19'),
        estado: 'activo'
      },
      {
        id: 3,
        tipo: 'prestamo',
        titulo: 'El Principito',
        fechaRetiro: new Date('2026-04-09'),
        fechaDevolucion: new Date('2026-04-19'),
        estado: 'finalizado'
      },
      {
        id: 4,
        tipo: 'reserva',
        titulo: 'Sala de estudio B-105',
        fechaRetiro: new Date('2026-06-30'),
        fechaDevolucion: new Date('2026-07-09'),
        estado: 'activo'
      },
      {
        id: 5,
        tipo: 'prestamo',
        titulo: 'Breve historia del tiempo',
        fechaRetiro: new Date('2026-07-31'),
        fechaDevolucion: new Date('2026-08-14'),
        estado: 'finalizado'
      }
    ];
  }

  // Getter calculado: Angular lo re-evalúa automáticamente cuando cambia filtroActivo
  get itemsFiltrados(): IHistorialItem[] {
    if (this.filtroActivo === 'prestamos') {
      return this.todosLosItems.filter(i => i.tipo === 'prestamo');
    }
    if (this.filtroActivo === 'reservas') {
      return this.todosLosItems.filter(i => i.tipo === 'reserva');
    }
    return this.todosLosItems;
  }

  get cantidadPrestamos(): number {
    return this.todosLosItems.filter(i => i.tipo === 'prestamo').length;
  }

  get cantidadReservas(): number {
    return this.todosLosItems.filter(i => i.tipo === 'reserva').length;
  }

  get cantidadActivos(): number {
    return this.todosLosItems.filter(i => i.estado === 'activo').length;
  }

  // Cambia el chip activo; el getter itemsFiltrados reacciona automáticamente
  setFiltro(filtro: 'todos' | 'prestamos' | 'reservas'): void {
    this.filtroActivo = filtro;
  }
}
