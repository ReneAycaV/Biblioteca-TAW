import { Component } from '@angular/core';
import { Libro } from '../../catalogo/lista-libros/lista-libros.component';
import { ListaLibrosComponent } from '../../catalogo/lista-libros/lista-libros.component';

export interface Prestamo {
  id: number;
  tipo: 'prestamo' | 'reserva';
  fechaRetiro: Date;
  fechaDevolucion: Date;
  estado: 'activo' | 'finalizado';
}

@Component({
  selector: 'app-historial-prestamos',
  templateUrl: './historial-prestamos.component.html',
  styleUrls: ['./historial-prestamos.component.css'],
})
export class HistorialPrestamosComponent {
  //prestamos: Prestamo[] = [];
  prestamos: Prestamo[] = [
    {
      id: 1,
      tipo: 'prestamo',
      fechaRetiro: new Date('2024-05-01'),
      fechaDevolucion: new Date('2024-05-15'),
      estado: 'finalizado',
    },
    {
      id: 2,
      tipo: 'reserva',
      fechaRetiro: new Date('2024-06-10'),
      fechaDevolucion: new Date('2024-06-20'),
      estado: 'activo',
    },
    {
      id: 3,
      tipo: 'prestamo',
      fechaRetiro: new Date('2024-04-10'),
      fechaDevolucion: new Date('2024-04-20'),
      estado: 'finalizado',
    },
    {
      id: 4,
      tipo: 'reserva',
      fechaRetiro: new Date('2024-07-01'),
      fechaDevolucion: new Date('2024-07-10'),
      estado: 'activo',
    },
  ];
}
