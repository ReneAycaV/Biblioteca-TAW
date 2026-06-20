import { Component, OnInit } from '@angular/core';

export interface IHistorialItem {
  id: number;
  tipo: 'prestamo' | 'reserva';
  titulo: string;
  fechaRetiro: Date;
  fechaDevolucion: Date;
  estado: 'activo' | 'finalizado' | 'cancelado' | 'vencido';
  // Solo aplica para reservas
  bloqueHorario?: string;
}

// Mapa de bloque letra a rango horario (A-K, del backend)
const BLOQUES_HORARIO: Record<string, string> = {
  A: '08:00 - 09:00',
  B: '09:00 - 10:00',
  C: '10:00 - 11:00',
  D: '11:00 - 12:00',
  E: '12:00 - 13:00',
  F: '13:00 - 14:00',
  G: '14:00 - 15:00',
  H: '15:00 - 16:00',
  I: '16:00 - 17:00',
  J: '17:00 - 18:00',
  K: '18:00 - 19:00',
};

@Component({
  selector: 'app-historial-prestamos',
  templateUrl: './historial-prestamos.component.html',
  styleUrls: ['./historial-prestamos.component.css']
})
export class HistorialPrestamosComponent implements OnInit {

  todosLosItems: IHistorialItem[] = [];
  filtroActivo: 'todos' | 'prestamos' | 'reservas' = 'todos';

  // Estado del modal de detalle
  modalVisible = false;
  itemSeleccionado: IHistorialItem | null = null;
  motivoCancelacion = '';
  cancelando = false;
  mensajeModalExito = '';
  mensajeModalError = '';

  constructor() {}

  ngOnInit(): void {
    this.cargarDatos();
  }

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
        fechaRetiro: new Date('2026-06-25'),
        fechaDevolucion: new Date('2026-06-25'),
        estado: 'activo',
        bloqueHorario: 'C'
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
        titulo: 'Sala de reuniones B-105',
        fechaRetiro: new Date('2026-07-02'),
        fechaDevolucion: new Date('2026-07-02'),
        estado: 'cancelado',
        bloqueHorario: 'G'
      },
      {
        id: 5,
        tipo: 'prestamo',
        titulo: 'Breve historia del tiempo',
        fechaRetiro: new Date('2026-05-10'),
        fechaDevolucion: new Date('2026-05-24'),
        estado: 'vencido'
      }
    ];
  }

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

  setFiltro(filtro: 'todos' | 'prestamos' | 'reservas'): void {
    this.filtroActivo = filtro;
  }

  // Devuelve el rango horario legible dado el bloque letra (A, B, C...)
  getBloqueTexto(bloque: string): string {
    return BLOQUES_HORARIO[bloque] ?? bloque;
  }

  // Abre el modal con el ítem seleccionado y limpia el estado previo
  abrirModal(item: IHistorialItem): void {
    this.itemSeleccionado = item;
    this.motivoCancelacion = '';
    this.mensajeModalExito = '';
    this.mensajeModalError = '';
    this.cancelando = false;
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.itemSeleccionado = null;
  }

  // Cancela la reserva activa (simulado con mock; cuando se conecte el backend
  // se reemplaza por: this.reservaService.cancelar(item.id, motivo).subscribe(...)
  cancelarReserva(): void {
    if (!this.itemSeleccionado) return;

    this.cancelando = true;
    this.mensajeModalError = '';

    // Simula el delay de la petición HTTP
    setTimeout(() => {
      const index = this.todosLosItems.findIndex(i => i.id === this.itemSeleccionado!.id);
      if (index !== -1) {
        this.todosLosItems[index] = {
          ...this.todosLosItems[index],
          estado: 'cancelado'
        };
        // Actualiza también la referencia del ítem seleccionado para reflejar el cambio en el modal
        this.itemSeleccionado = { ...this.todosLosItems[index] };
      }
      this.cancelando = false;
      this.mensajeModalExito = 'Reserva cancelada correctamente.';
    }, 600);
  }

  // Devuelve el texto de estado visible según el valor interno
  getTextoEstado(estado: string): string {
    const textos: Record<string, string> = {
      activo:    'Activo',
      finalizado:'Finalizado',
      cancelado: 'Cancelado',
      vencido:   'Vencido'
    };
    return textos[estado] ?? estado;
  }
}
