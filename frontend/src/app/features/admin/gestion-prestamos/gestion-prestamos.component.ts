import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { PrestamosService } from '/Users/winston/Desktop/biblio_repo/Biblioteca-TAW/frontend/src/app/features/prestamos/services/prestamos.service';
import { IPrestamo } from '../../../shared/interfaces/iprestamo';
import { ILibro } from 'src/app/shared/interfaces/ilibro-detalle';

// Mapa de bloque letra a rango horario (A-K del backend)
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

function crearFechaLocal(fecha: string | Date): Date {
  if (fecha instanceof Date) return fecha;

  const [soloFecha] = fecha.split('T');
  const [year, month, day] = soloFecha.split('-').map(Number);

  if (!year || !month || !day) {
    return new Date(fecha);
  }

  return new Date(year, month - 1, day);
}

@Component({
  selector: 'app-gestion-prestamos',
  templateUrl: './gestion-prestamos.component.html',
  styleUrls: ['./gestion-prestamos.component.css'],
})
export class GestionPrestamosComponent {
  todosLosItems: IPrestamo[] = [];
  filtroActivo: 'todos' | 'Activo' | 'Vencido' | 'Devuelto' | 'Perdido' =
    'todos';

  // Estado de carga general
  cargando = false;
  mensajeCargaError = '';

  // Estado del modal de detalle
  modalVisible = false;
  itemSeleccionado: IPrestamo | null = null;
  motivoCancelacion = '';
  cancelando = false;
  mensajeModalExito = '';
  mensajeModalError = '';

  private sub!: Subscription;

  constructor(private prestamosService: PrestamosService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.mensajeCargaError = '';
    this.sub = this.prestamosService.getMiHistorial().subscribe({
      next: (data) => {
        const prestamosItems = data.prestamos.map((p) =>
          this.mapearPrestamo(p),
        );
        // Combina y ordena por fecha de retiro descendente
        this.todosLosItems = [...prestamosItems].sort((a) =>
          a.fechaPrestamo.getTime(),
        );
        this.cargando = false;
      },
      error: (err) => {
        if (err.status === 401) {
          this.mensajeCargaError =
            'No estás autorizado. Inicia sesión nuevamente.';
        } else {
          this.mensajeCargaError =
            'Error al cargar el historial. Intenta más tarde.';
        }
        this.cargando = false;
        console.error('Error al cargar historial:', err);
      },
    });
  }

  // Convierte una IPrestamo del backend a IHistorialItem para la vista
  private mapearPrestamo(p: IPrestamo): IPrestamo {
    return {
      idPrestamo: p.idPrestamo,
      libro: p.libro as ILibro,
      fechaPrestamo: crearFechaLocal(p.fechaPrestamo),
      fechaDevolucionEsperada: crearFechaLocal(p.fechaDevolucionEsperada),
      estado: p.estado,
    };
  }

  // 1=ACTIVO, 2=DEVUELTO, 3=VENCIDO, 4=PERDIDO → estado de la vista
  public mapearEstadoPrestamo(
    estado: number,
  ): 'activo' | 'devuelto' | 'vencido' | 'perdido' {
    if (estado === 1) return 'activo';
    if (estado === 2) return 'devuelto';
    if (estado === 4) return 'perdido';
    return 'vencido';
  }

  get itemsFiltrados(): IPrestamo[] {
    if (this.filtroActivo === 'Activo') {
      return this.todosLosItems.filter((i) => i.estado === 1);
    }
    if (this.filtroActivo === 'Devuelto') {
      return this.todosLosItems.filter((i) => i.estado === 2);
    }
    if (this.filtroActivo === 'Vencido') {
      return this.todosLosItems.filter((i) => i.estado === 3);
    }
    if (this.filtroActivo === 'Perdido') {
      return this.todosLosItems.filter((i) => i.estado === 4);
    }
    return this.todosLosItems;
  }

  get cantidadPrestamos(): number {
    return this.todosLosItems.length;
  }

  get cantidadDevueltos(): number {
    return this.todosLosItems.filter((i) => i.estado === 2).length;
  }

  get cantidadVencidos(): number {
    return this.todosLosItems.filter((i) => i.estado === 3).length;
  }

  get cantidadPerdidos(): number {
    return this.todosLosItems.filter((i) => i.estado === 4).length;
  }

  get cantidadActivos(): number {
    return this.todosLosItems.filter((i) => i.estado === 1).length;
  }

  setFiltro(
    filtro: 'todos' | 'Activo' | 'Devuelto' | 'Vencido' | 'Perdido',
  ): void {
    this.filtroActivo = filtro;
  }

  getBloqueTexto(bloque: string): string {
    return BLOQUES_HORARIO[bloque] ?? bloque;
  }

  abrirModal(item: IPrestamo): void {
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

  getTextoEstado(estado: string): string {
    const textos: Record<string, string> = {
      activo: 'Activo',
      finalizado: 'Finalizado',
      cancelado: 'Cancelado',
      vencido: 'Vencido',
    };
    return textos[estado] ?? estado;
  }
}
